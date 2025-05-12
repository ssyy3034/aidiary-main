package org.aidiary.service;

import org.apache.http.HttpEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.mime.MultipartEntityBuilder;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

@Service
public class ImageService {

    private final String FLASK_API_URL = "http://aidiary-main-face-api-1:5001/analyze";

    public String sendImages(MultipartFile parent1, MultipartFile parent2) throws IOException {
        File parent1File = convertToFile(parent1, "parent1.jpg");
        File parent2File = convertToFile(parent2, "parent2.jpg");

        try (CloseableHttpClient client = HttpClients.createDefault()) {
            HttpPost post = new HttpPost(FLASK_API_URL);

            MultipartEntityBuilder builder = MultipartEntityBuilder.create();
            builder.addBinaryBody("parent1", parent1File);
            builder.addBinaryBody("parent2", parent2File);

            HttpEntity entity = builder.build();
            post.setEntity(entity);

            try (CloseableHttpResponse response = client.execute(post)) {
                int statusCode = response.getStatusLine().getStatusCode();
                if (statusCode == 200) {
                    return EntityUtils.toString(response.getEntity());
                } else {
                    return "Error: " + statusCode;
                }
            }

        } finally {
            parent1File.delete();
            parent2File.delete();
        }
    }

    private File convertToFile(MultipartFile file, String fileName) throws IOException {
        File convFile = new File(System.getProperty("java.io.tmpdir") + "/" + fileName);
        try (FileOutputStream fos = new FileOutputStream(convFile)) {
            fos.write(file.getBytes());
        }
        return convFile;
    }
}
