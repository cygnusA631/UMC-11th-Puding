package com.umc.movie.controller;

import java.util.List;
import com.umc.movie.dto.RatingResponse;
import com.umc.movie.dto.ApiResponse;
import com.umc.movie.dto.CreateRatingRequest;
import com.umc.movie.dto.UpdateRatingRequest;
import com.umc.movie.service.RatingService;
import jakarta.validation.constraints.Positive;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/members")
public class RatingController {
    private final RatingService ratingService;

    @GetMapping("/{memberId}/ratings")
    public List<RatingResponse> getMemberRatings(@PathVariable
            @Positive(message = "회원 ID는 양의 정수여야 합니다.") Long memberId) {
        return ratingService.getRatingsByMember(memberId);
    }

    @PostMapping("/{memberId}/ratings")
    public ResponseEntity<ApiResponse<Long>> create(
            @PathVariable @Positive(message = "회원 ID는 양의 정수여야 합니다.") Long memberId,
            @Valid @RequestBody CreateRatingRequest request) {
        return ResponseEntity.status(201).body(ApiResponse.created(
                "평점 등록에 성공했습니다.", ratingService.create(memberId, request)));
    }

    @PatchMapping("/{memberId}/ratings/{ratingId}")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable @Positive(message = "회원 ID는 양의 정수여야 합니다.") Long memberId,
            @PathVariable @Positive(message = "평점 ID는 양의 정수여야 합니다.") Long ratingId,
            @Valid @RequestBody UpdateRatingRequest request) {
        ratingService.update(ratingId, memberId, request);
        return ResponseEntity.ok(ApiResponse.ok("평점 수정에 성공했습니다.", null));
    }

    @DeleteMapping("/{memberId}/ratings/{ratingId}")
    public ResponseEntity<Void> delete(
            @PathVariable @Positive(message = "회원 ID는 양의 정수여야 합니다.") Long memberId,
            @PathVariable @Positive(message = "평점 ID는 양의 정수여야 합니다.") Long ratingId) {
        ratingService.delete(ratingId, memberId);
        return ResponseEntity.noContent().build();
    }
}
