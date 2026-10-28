package com.umc.movie;

import java.util.UUID;
import com.umc.movie.entity.Member;
import com.umc.movie.entity.Rating;
import com.umc.movie.repository.MemberRepository;
import com.umc.movie.repository.RatingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class MovieApiIntegrationTests {
    @Autowired MockMvc mockMvc;
    @Autowired MemberRepository memberRepository;
    @Autowired RatingRepository ratingRepository;
    private Member member;

    @BeforeEach
    void createMember() {
        String unique = UUID.randomUUID().toString().substring(0, 8);
        member = memberRepository.saveAndFlush(new Member(unique + "@example.com", "dummy-hash", "회원" + unique));
    }

    @Test
    void duplicateAndUnusedNicknamesReturnAvailability() throws Exception {
        mockMvc.perform(get("/members/nickname/{nickname}", member.getNickname()))
                .andExpect(status().isOk()).andExpect(content().json("{\"available\":false}"));
        mockMvc.perform(get("/members/nickname/{nickname}", "새" + UUID.randomUUID().toString().substring(0, 8)))
                .andExpect(status().isOk()).andExpect(content().json("{\"available\":true}"));
    }

    @Test
    void duplicateAndUnusedEmailsReturnAvailability() throws Exception {
        mockMvc.perform(get("/members/email/{email}", member.getEmail()))
                .andExpect(status().isOk()).andExpect(content().json("{\"available\":false}"));
        mockMvc.perform(get("/members/email/{email}", UUID.randomUUID() + "@example.com"))
                .andExpect(status().isOk()).andExpect(content().json("{\"available\":true}"));
    }

    @Test
    void invalidNicknameAndEmailReturn400BeforeCheckingAvailability() throws Exception {
        for (String nickname : new String[]{"a", "x".repeat(13), "  "}) {
            mockMvc.perform(get("/members/nickname/{nickname}", nickname))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
        }
        mockMvc.perform(get("/members/email/{email}", "not-an-email"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
    }

    @Test
    void ratingsAreNewestFirstAndExposeOnlyDtoFields() throws Exception {
        Rating first = ratingRepository.saveAndFlush(new Rating(member, 550L, 5, "첫 번째"));
        Rating second = ratingRepository.saveAndFlush(new Rating(member, 155L, 4, "두 번째"));
        mockMvc.perform(get("/members/{memberId}/ratings", member.getMemberId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].ratingId").value(second.getRatingId()))
                .andExpect(jsonPath("$[0].movieId").value(155))
                .andExpect(jsonPath("$[0].score").value(4))
                .andExpect(jsonPath("$[0].comment").value("두 번째"))
                .andExpect(jsonPath("$[0].createdAt").isString())
                .andExpect(jsonPath("$[0].updatedAt").isString())
                .andExpect(jsonPath("$[0].member").doesNotExist())
                .andExpect(jsonPath("$[0].password").doesNotExist())
                .andExpect(jsonPath("$[1].ratingId").value(first.getRatingId()));
    }

    @Test
    void existingMemberWithoutRatingsGetsEmptyArray() throws Exception {
        mockMvc.perform(get("/members/{memberId}/ratings", member.getMemberId()))
                .andExpect(status().isOk()).andExpect(content().json("[]"));
    }

    @Test
    void missingMemberGets404() throws Exception {
        mockMvc.perform(get("/members/{memberId}/ratings", Long.MAX_VALUE))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("MEMBER_NOT_FOUND"));
    }

    @Test
    void invalidMemberIdsGet400() throws Exception {
        for (String memberId : new String[]{"0", "-1", "abc"}) {
            mockMvc.perform(get("/members/{memberId}/ratings", memberId))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
        }
    }

    @Test
    void allowedOriginReceivesCorsHeaderAndPreflightSucceeds() throws Exception {
        mockMvc.perform(get("/members/nickname/{nickname}", member.getNickname())
                        .header("Origin", "http://localhost:5173"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
        mockMvc.perform(options("/members/1/ratings")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    void unlistedOriginIsRejected() throws Exception {
        mockMvc.perform(get("/members/nickname/{nickname}", member.getNickname())
                        .header("Origin", "http://127.0.0.1:5173"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
