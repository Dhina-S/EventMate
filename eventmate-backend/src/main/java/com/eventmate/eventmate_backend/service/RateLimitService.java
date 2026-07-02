package com.eventmate.eventmate_backend.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * In-memory IP-based rate limiter using Bucket4j.
 * Each unique IP address gets its own token bucket.
 * Limit: 10 requests per minute per IP.
 */
@Service
public class RateLimitService {

    private static final int CAPACITY = 10;
    private static final Duration REFILL_PERIOD = Duration.ofMinutes(1);

    // ConcurrentHashMap safely handles multi-threaded access
    private final ConcurrentMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    /**
     * Returns the bucket for a given IP, creating one lazily on first access.
     */
    public Bucket resolveBucket(String ipAddress) {
        return buckets.computeIfAbsent(ipAddress, this::newBucket);
    }

    /**
     * Attempts to consume one token from the bucket.
     * @return true if the request is allowed, false if rate-limited.
     */
    public boolean tryConsume(String ipAddress) {
        Bucket bucket = resolveBucket(ipAddress);
        return bucket.tryConsume(1);
    }

    private Bucket newBucket(String ipAddress) {
        Bandwidth limit = Bandwidth.classic(CAPACITY, Refill.greedy(CAPACITY, REFILL_PERIOD));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}
