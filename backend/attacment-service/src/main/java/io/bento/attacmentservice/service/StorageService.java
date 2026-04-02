package io.bento.attacmentservice.service;

import io.bento.attacmentservice.config.StorageProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.S3Client;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final StorageProperties storageProperties;

    public String generateUploadUrl(String s3Key, String contentType) {
        var putRequest = PutObjectRequest.builder()
                .bucket(storageProperties.bucketName())
                .key(s3Key)
                .contentType(contentType)
                .build();

        var presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(storageProperties.uploadUrlExpiryMinutes()))
                .putObjectRequest(putRequest)
                .build();

        return s3Presigner.presignPutObject(presignRequest).url().toString();
    }

    public String generateDownloadUrl(String s3Key) {
        var getRequest = GetObjectRequest.builder()
                .bucket(storageProperties.bucketName())
                .key(s3Key)
                .build();

        var presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(storageProperties.downloadUrlExpiryMinutes()))
                .getObjectRequest(getRequest)
                .build();

        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }

    public void delete(String s3Key) {
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(storageProperties.bucketName())
                .key(s3Key)
                .build());
    }
}
