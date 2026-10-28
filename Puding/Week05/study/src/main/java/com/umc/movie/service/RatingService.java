package com.umc.movie.service;

import java.util.List;
import com.umc.movie.dto.RatingResponse;
import com.umc.movie.exception.MemberNotFoundException;
import com.umc.movie.repository.MemberRepository;
import com.umc.movie.repository.RatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RatingService {
    private final MemberRepository memberRepository;
    private final RatingRepository ratingRepository;

    public List<RatingResponse> getRatingsByMember(Long memberId) {
        if (!memberRepository.existsById(memberId)) {
            throw new MemberNotFoundException(memberId);
        }
        return ratingRepository.findByMember_MemberIdOrderByRatingIdDesc(memberId)
                .stream().map(RatingResponse::from).toList();
    }
}
