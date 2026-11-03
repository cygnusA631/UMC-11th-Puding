package com.umc.movie.dto;

import java.time.LocalDateTime;
import com.umc.movie.entity.Rating;

public record RatingResponse(
        Long ratingId,
        Long movieId,
        Integer score,
        String comment,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static RatingResponse from(Rating rating) {
        return new RatingResponse(rating.getRatingId(), rating.getMovieId(),
                rating.getScore(), rating.getComment(), rating.getCreatedAt(), rating.getUpdatedAt());
    }
}
