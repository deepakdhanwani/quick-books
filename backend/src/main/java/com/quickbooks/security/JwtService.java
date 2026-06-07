package com.quickbooks.security;

import com.quickbooks.config.AppProperties;
import com.quickbooks.entity.enums.ActorType;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private final AppProperties appProperties;

    public JwtService(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    public String generateToken(UserPrincipal principal) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + appProperties.getJwt().getExpirationMs());

        var builder = Jwts.builder()
                .subject(principal.getIdentifier())
                .claim("id", principal.getSubscriberId())
                .claim("subscriberId", principal.getSubscriberId())
                .claim("role", principal.getRole().name())
                .issuedAt(now)
                .expiration(expiry);

        if (principal.getRole() == UserRole.SUBSCRIBER) {
            builder.claim("actorType", principal.getActorType().name())
                    .claim("actorId", principal.getActorId())
                    .claim("actorName", principal.getActorName())
                    .claim("actorPin", principal.getActorPin());
        }

        return builder.signWith(getSigningKey()).compact();
    }

    public UserPrincipal parseToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        UserRole role = UserRole.valueOf(claims.get("role", String.class));

        if (role == UserRole.ADMIN) {
            return UserPrincipal.admin(
                    claims.get("id", Long.class),
                    claims.getSubject()
            );
        }

        Long subscriberId = claims.get("subscriberId", Long.class);
        if (subscriberId == null) {
            subscriberId = claims.get("id", Long.class);
        }

        String actorTypeValue = claims.get("actorType", String.class);
        ActorType actorType = actorTypeValue != null ? ActorType.valueOf(actorTypeValue) : ActorType.OWNER;
        Long actorId = claims.get("actorId", Long.class);
        if (actorId == null) {
            actorId = subscriberId;
        }
        String actorName = claims.get("actorName", String.class);
        if (actorName == null) {
            actorName = claims.getSubject();
        }
        String actorPin = claims.get("actorPin", String.class);
        if (actorPin == null) {
            actorPin = "OWNER";
        }

        return new UserPrincipal(
                subscriberId,
                claims.getSubject(),
                role,
                actorType,
                actorId,
                actorName,
                actorPin
        );
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = appProperties.getJwt().getSecret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
