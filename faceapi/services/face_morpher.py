"""
face_morpher.py - OpenCV Delaunay 삼각분할 기반 얼굴 모핑

부모 두 명의 랜드마크 + 블렌딩된 자녀 랜드마크를 이용하여
어파인 워프 + 알파 블렌딩으로 모핑된 참조 이미지를 생성
"""

import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)

OUTPUT_SIZE = (512, 512)


def _rect_contains(rect, point):
    """사각형 내부에 점이 있는지 확인"""
    return (rect[0] <= point[0] < rect[2] and
            rect[1] <= point[1] < rect[3])


def _get_delaunay_triangles(rect, points):
    """Delaunay 삼각분할 수행 → 삼각형 인덱스 리스트 반환"""
    subdiv = cv2.Subdiv2D(rect)
    point_to_idx = {}

    for i, p in enumerate(points):
        px = (float(np.clip(p[0], rect[0], rect[2] - 1)),
              float(np.clip(p[1], rect[1], rect[3] - 1)))
        subdiv.insert(px)
        point_to_idx[(int(px[0]), int(px[1]))] = i

    triangle_list = subdiv.getTriangleList()
    triangles = []

    for t in triangle_list:
        pts = [(int(t[0]), int(t[1])),
               (int(t[2]), int(t[3])),
               (int(t[4]), int(t[5]))]

        if all(_rect_contains(rect, p) for p in pts):
            indices = []
            for p in pts:
                idx = point_to_idx.get(p)
                if idx is None:
                    # 가장 가까운 점 찾기
                    dists = [((p[0] - q[0])**2 + (p[1] - q[1])**2, i)
                             for i, q in enumerate(points)]
                    idx = min(dists, key=lambda x: x[0])[1]
                indices.append(idx)
            triangles.append(tuple(indices))

    return triangles


def _warp_triangle(img_src, img_dst, tri_src, tri_dst):
    """소스 삼각형을 목적지 삼각형으로 어파인 워프"""
    r_src = cv2.boundingRect(np.float32([tri_src]))
    r_dst = cv2.boundingRect(np.float32([tri_dst]))

    tri_src_crop = [(p[0] - r_src[0], p[1] - r_src[1]) for p in tri_src]
    tri_dst_crop = [(p[0] - r_dst[0], p[1] - r_dst[1]) for p in tri_dst]

    # 소스 이미지에서 바운딩 사각형 영역 추출
    x, y, w, h = r_src
    if w <= 0 or h <= 0:
        return
    img_crop = img_src[y:y+h, x:x+w]
    if img_crop.size == 0:
        return

    # 어파인 변환 행렬
    mat = cv2.getAffineTransform(
        np.float32(tri_src_crop),
        np.float32(tri_dst_crop)
    )

    x2, y2, w2, h2 = r_dst
    if w2 <= 0 or h2 <= 0:
        return

    warped = cv2.warpAffine(
        img_crop, mat, (w2, h2),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_REFLECT_101
    )

    # 마스크 생성
    mask = np.zeros((h2, w2, 3), dtype=np.float32)
    cv2.fillConvexPoly(mask, np.int32(tri_dst_crop), (1.0, 1.0, 1.0))

    # 목적지에 블렌딩
    dst_region = img_dst[y2:y2+h2, x2:x2+w2]
    if dst_region.shape != warped.shape:
        return
    img_dst[y2:y2+h2, x2:x2+w2] = (
        dst_region * (1 - mask) + warped * mask
    )


def _add_boundary_points(points, w, h):
    """이미지 경계 포인트를 추가하여 전체 영역 커버"""
    boundary = [
        (0, 0), (w//2, 0), (w-1, 0),
        (0, h//2), (w-1, h//2),
        (0, h-1), (w//2, h-1), (w-1, h-1),
    ]
    return points + boundary


def morph_faces(img1, img2, landmarks1, landmarks2, child_landmarks, alpha=0.5):
    """
    두 부모 얼굴을 자녀 랜드마크 기준으로 모핑

    Args:
        img1: 부모1 이미지 (BGR, numpy array)
        img2: 부모2 이미지 (BGR, numpy array)
        landmarks1: 부모1 랜드마크 [(x,y), ...] (정규화된 좌표 아님, 픽셀)
        landmarks2: 부모2 랜드마크
        child_landmarks: 블렌딩된 자녀 랜드마크
        alpha: 부모1 가중치 (0.5 = 균등)

    Returns:
        morphed_image: 모핑된 결과 이미지 (BGR, 512x512)
    """
    h, w = OUTPUT_SIZE

    # 이미지 리사이즈
    img1_resized = cv2.resize(img1, (w, h))
    img2_resized = cv2.resize(img2, (w, h))

    # 랜드마크를 출력 크기에 맞게 스케일링
    def scale_landmarks(lms, orig_shape):
        oh, ow = orig_shape[:2]
        return [(p[0] * w / ow, p[1] * h / oh) for p in lms]

    pts1 = scale_landmarks(landmarks1, img1.shape)
    pts2 = scale_landmarks(landmarks2, img2.shape)
    pts_child = scale_landmarks(child_landmarks, img1.shape)

    # 경계 포인트 추가
    pts1 = _add_boundary_points(pts1, w, h)
    pts2 = _add_boundary_points(pts2, w, h)
    pts_child = _add_boundary_points(pts_child, w, h)

    # 포인트 수 맞추기
    n = min(len(pts1), len(pts2), len(pts_child))
    pts1 = pts1[:n]
    pts2 = pts2[:n]
    pts_child = pts_child[:n]

    # Delaunay 삼각분할 (자녀 랜드마크 기준)
    rect = (0, 0, w, h)
    triangles = _get_delaunay_triangles(rect, pts_child)

    if not triangles:
        logger.warning("Delaunay 삼각분할 실패, 단순 알파 블렌딩으로 폴백")
        return cv2.addWeighted(img1_resized, alpha, img2_resized, 1 - alpha, 0)

    # 모핑 결과 이미지
    morphed = np.zeros((h, w, 3), dtype=np.float32)
    img1_f = img1_resized.astype(np.float32)
    img2_f = img2_resized.astype(np.float32)

    for tri_idx in triangles:
        i, j, k = tri_idx
        if max(i, j, k) >= n:
            continue

        tri1 = [pts1[i], pts1[j], pts1[k]]
        tri2 = [pts2[i], pts2[j], pts2[k]]
        tri_child = [pts_child[i], pts_child[j], pts_child[k]]

        # 각 부모에서 자녀 삼각형으로 워프
        morph1 = np.zeros_like(morphed)
        morph2 = np.zeros_like(morphed)
        _warp_triangle(img1_f, morph1, tri1, tri_child)
        _warp_triangle(img2_f, morph2, tri2, tri_child)

        # 삼각형 영역 마스크
        mask = np.zeros((h, w, 3), dtype=np.float32)
        cv2.fillConvexPoly(mask, np.int32(tri_child), (1, 1, 1))

        # 알파 블렌딩
        morphed += (alpha * morph1 + (1 - alpha) * morph2) * mask

    morphed = np.clip(morphed, 0, 255).astype(np.uint8)

    # Seamless cloning으로 경계 부드럽게
    try:
        center = (w // 2, h // 2)
        hull = cv2.convexHull(np.int32(pts_child[:n-8]))  # 경계 포인트 제외
        mask_hull = np.zeros((h, w), dtype=np.uint8)
        cv2.fillConvexPoly(mask_hull, hull, 255)
        # 마스크가 유효한 경우에만 seamless clone
        if np.sum(mask_hull) > 0:
            bg = cv2.addWeighted(img1_resized, alpha, img2_resized, 1 - alpha, 0)
            morphed = cv2.seamlessClone(morphed, bg, mask_hull, center, cv2.NORMAL_CLONE)
    except Exception as e:
        logger.debug(f"Seamless clone 스킵: {e}")

    return morphed


def create_morphed_reference(img1_path, img2_path, landmarks1, landmarks2, child_landmarks):
    """
    파일 경로에서 이미지를 읽어 모핑된 참조 이미지를 생성

    Returns:
        morphed_image: BGR numpy array (512x512)
    """
    img1 = cv2.imread(img1_path)
    img2 = cv2.imread(img2_path)

    if img1 is None or img2 is None:
        raise ValueError("부모 이미지를 읽을 수 없습니다")

    return morph_faces(img1, img2, landmarks1, landmarks2, child_landmarks)
