package com.ringo.PersonalRoute.Services;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private static final long EXPIRATION_TIME = 86_400_000L;
    private static final String ISSUER = "personal-route";

    private final String secret;
    private SecretKey key;

    public JwtService(@Value("${jwt.secret}") String secret) {
        this.secret = secret;
    }

    @PostConstruct
    void init() {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "jwt.secret is not set. Provide JWT_SECRET env variable (openssl rand -base64 48).");
        }
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException(
                    "jwt.secret must be at least 32 bytes (currently " + bytes.length + ").");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
    }

    public String generateToken(String email, String name) {
        Date now = new Date();
        return Jwts.builder()
                .issuer(ISSUER)
                .subject(email)
                .claim("name", name)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + EXPIRATION_TIME))
                .signWith(key)
                .compact();
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractName(String token) {
        return parseClaims(token).get("name", String.class);
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = parseClaims(token);
            return ISSUER.equals(claims.getIssuer())
                    && claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .requireIssuer(ISSUER)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}