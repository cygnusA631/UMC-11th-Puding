package com.umc.movie.controller;

import java.util.List;
import com.umc.movie.dto.RatingResponse;
import com.umc.movie.service.RatingService;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
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
}
