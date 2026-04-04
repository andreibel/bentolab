package io.bento.attacmentservice.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.CORSConfiguration;
import software.amazon.awssdk.services.s3.model.CORSRule;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.PutBucketCorsRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Configuration
@EnableConfigurationProperties(StorageProperties.class)
public class S3Config {

    private static final Logger log = LoggerFactory.getLogger(S3Config.class);

    @Bean
    public S3Client s3Client(StorageProperties props) {
        var credentials = StaticCredentialsProvider.create(
                AwsBasicCredentials.create(props.accessKey(), props.secretKey())
        );
        var builder = S3Client.builder()
                .region(Region.of(props.region()))
                .credentialsProvider(credentials);
        if (props.endpoint() != null && !props.endpoint().isBlank()) {
            builder.endpointOverride(URI.create(props.endpoint()));
        }
        if (props.pathStyleAccess()) {
            builder.forcePathStyle(true);
        }
        return builder.build();
    }

    @Bean
    public S3Presigner s3Presigner(StorageProperties props) {
        var credentials = StaticCredentialsProvider.create(
                AwsBasicCredentials.create(props.accessKey(), props.secretKey())
        );
        var builder = S3Presigner.builder()
                .region(Region.of(props.region()))
                .credentialsProvider(credentials)
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(props.pathStyleAccess())
                        .build());
        if (props.endpoint() != null && !props.endpoint().isBlank()) {
            builder.endpointOverride(URI.create(props.endpoint()));
        }
        return builder.build();
    }

    @Bean
    public ApplicationRunner ensureBucketExists(S3Client s3Client, StorageProperties props) {
        return args -> {
            String bucket = props.bucketName();
            try {
                s3Client.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
            } catch (NoSuchBucketException e) {
                s3Client.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
            }
            applyBucketCors(s3Client, bucket, props);
        };
    }

    private void applyBucketCors(S3Client s3Client, String bucket, StorageProperties props) {
        try {
            CORSRule rule = CORSRule.builder()
                    .allowedOrigins(props.corsOrigins())
                    .allowedMethods("GET", "PUT", "HEAD")
                    .allowedHeaders("*")
                    .exposeHeaders("ETag")
                    .maxAgeSeconds(3600)
                    .build();

            s3Client.putBucketCors(PutBucketCorsRequest.builder()
                    .bucket(bucket)
                    .corsConfiguration(CORSConfiguration.builder().corsRules(rule).build())
                    .build());

            log.info("Bucket CORS configured for origins: {}", props.corsOrigins());
        } catch (S3Exception e) {
            // MinIO does not support putBucketCors via the AWS SDK (returns 501).
            // Set CORS manually with: mc anonymous set-json cors.json myminio/bento
            // See docs/minio-cors.md for the required JSON and setup steps.
            log.warn("Could not apply bucket CORS rules (storage may not support this API — set CORS manually): {}", e.getMessage());
        }
    }
}
