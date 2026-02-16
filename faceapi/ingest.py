from services.knowledge_base import KnowledgeBase
import sys
import requests

def check_connectivity():
    print("[INFO] Checking internet connectivity...", flush=True)
    try:
        response = requests.get("https://www.google.com", timeout=5)
        if response.status_code == 200:
            print("[INFO] Internet connection confirmed.", flush=True)
            return True
    except Exception as e:
        print(f"[ERROR] Internet connection failed: {e}", flush=True)
        return False

def ingest_trusted_data():
    """
    Ingests data from trusted sources as defined in the governance report.
    """
    if not check_connectivity():
        print("[ERROR] Cannot proceed without internet connection.", flush=True)
        sys.exit(1)

    # 1. Defined Trusted Sources (Gov, Educ, Org)
    trusted_urls = [
        "https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do", # KDCA General Health
        "https://www.childcare.go.kr/", # Childcare Portal
        "https://www.foodsafetykorea.go.kr/portal/healthyfoodlife/pregnantWomen.do?menu_no=3082&menu_grp=MENU_NEW03", # Food Safety for Pregnant Women
    ]

    # 2. Domain Validation Logic (Governance)
    trusted_domains = [".go.kr", ".ac.kr", ".re.kr", ".or.kr", "snuh.org", "msdmanuals.com"]

    valid_urls = []
    for url in trusted_urls:
        if any(domain in url for domain in trusted_domains):
            valid_urls.append(url)
        else:
            print(f"[WARN] Skipping untrusted domain: {url}", flush=True)

    if not valid_urls:
        print("[ERROR] No valid URLs found.", flush=True)
        sys.exit(1)

    # 3. Ingest
    print(f"[INFO] Starting ingestion for {len(valid_urls)} trusted URLs...", flush=True)
    kb = KnowledgeBase()
    try:
        kb.ingest_from_urls(valid_urls)
        print("[INFO] Ingestion process completed successfully.", flush=True)
    except Exception as e:
        print(f"[ERROR] Ingestion failed: {e}", flush=True)
        sys.exit(1)

if __name__ == "__main__":
    ingest_trusted_data()
