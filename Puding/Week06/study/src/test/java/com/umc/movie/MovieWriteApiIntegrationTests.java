package com.umc.movie;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.umc.movie.entity.Member;
import com.umc.movie.entity.Rating;
import com.umc.movie.repository.MemberRepository;
import com.umc.movie.repository.RatingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doReturn;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class MovieWriteApiIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @MockitoSpyBean MemberRepository members;
    @Autowired RatingRepository ratings;
    @Autowired PasswordEncoder encoder;
    private Member owner;

    @BeforeEach
    void createOwner() {
        String suffix = suffix();
        owner = members.saveAndFlush(new Member(suffix + "@example.com", "fixture-only", "회원" + suffix));
    }

    @Test
    void signupPersistsBcryptAndReturnsOnlyPublicFields() throws Exception {
        String suffix = suffix();
        MvcResult response = mvc.perform(post("/members").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", suffix + "@example.com", "password", "Umc!1234", "nickname", "신규" + suffix))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.isSuccess").value(true))
                .andExpect(jsonPath("$.code").value("COMMON201"))
                .andExpect(jsonPath("$.result.email").value(suffix + "@example.com"))
                .andExpect(jsonPath("$.result.password").doesNotExist()).andReturn();
        JsonNode body = mapper.readTree(response.getResponse().getContentAsString());
        assertThat(body.get("result").size()).isEqualTo(3);
        Member saved = members.findById(body.at("/result/memberId").asLong()).orElseThrow();
        assertThat(saved.getPassword()).hasSize(60).isNotEqualTo("Umc!1234");
        assertThat(encoder.matches("Umc!1234", saved.getPassword())).isTrue();
    }

    @Test
    void signupRejectsMissingFieldsAndInvalidEmailNicknamePassword() throws Exception {
        String[] invalidBodies = {
                "{}",
                json(Map.of("email", "bad-email", "password", "Umc!1234", "nickname", "정상닉네임")),
                json(Map.of("email", "valid@example.com", "password", "weak", "nickname", "정상닉네임")),
                json(Map.of("email", "valid@example.com", "password", "Umc!1234", "nickname", "a")),
                json(Map.of("email", "valid@example.com", "password", "Umc!1234", "nickname", "가".repeat(13)))
        };
        long before = members.count();
        for (String body : invalidBodies) {
            mvc.perform(post("/members").contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.isSuccess").value(false))
                    .andExpect(jsonPath("$.code").value("COMMON400"))
                    .andExpect(jsonPath("$.result").isEmpty());
        }
        assertThat(members.count()).isEqualTo(before);
    }

    @Test
    void duplicateEmailAndNicknameHaveDistinctCodesWithoutInserts() throws Exception {
        long before = members.count();
        mvc.perform(post("/members").contentType(MediaType.APPLICATION_JSON).content(json(Map.of(
                        "email", owner.getEmail(), "password", "Umc!1234", "nickname", "다른" + suffix()))))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("MEMBER4091"));
        mvc.perform(post("/members").contentType(MediaType.APPLICATION_JSON).content(json(Map.of(
                        "email", suffix() + "@example.com", "password", "Umc!1234", "nickname", owner.getNickname()))))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("MEMBER4092"));
        assertThat(members.count()).isEqualTo(before);
    }

    @Test
    void bcryptLimitIsCheckedInUtf8BytesWithoutRejecting72ByteBoundary() throws Exception {
        String atLimit = "Aa1!" + "가".repeat(22) + "ab";
        String overLimit = "Aa1!" + "가".repeat(23);
        mvc.perform(post("/members").contentType(MediaType.APPLICATION_JSON).content(json(Map.of(
                        "email", suffix() + "@example.com", "password", atLimit, "nickname", "경계" + suffix()))))
                .andExpect(status().isCreated());
        mvc.perform(post("/members").contentType(MediaType.APPLICATION_JSON).content(json(Map.of(
                        "email", suffix() + "@example.com", "password", overLimit, "nickname", "초과" + suffix()))))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("COMMON400"));
    }

    @Test
    void ratingsCreatePatchReadDeleteLifecycleAnd204Body() throws Exception {
        MvcResult created = mvc.perform(post("/members/{id}/ratings", owner.getMemberId())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"movieId\":550,\"score\":5,\"comment\":\"첫 후기\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.code").value("COMMON201"))
                .andExpect(jsonPath("$.result").isNumber()).andReturn();
        long id = mapper.readTree(created.getResponse().getContentAsString()).get("result").asLong();
        mvc.perform(patch("/members/{member}/ratings/{rating}", owner.getMemberId(), id)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"score\":3,\"comment\":\"수정 후기\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.code").value("COMMON200"))
                .andExpect(jsonPath("$.result").isEmpty());
        mvc.perform(get("/members/{id}/ratings", owner.getMemberId()))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].ratingId").value(id))
                .andExpect(jsonPath("$[0].score").value(3)).andExpect(jsonPath("$[0].comment").value("수정 후기"))
                .andExpect(jsonPath("$[0].password").doesNotExist());
        mvc.perform(delete("/members/{member}/ratings/{rating}", owner.getMemberId(), id))
                .andExpect(status().isNoContent()).andExpect(content().string(""));
        mvc.perform(get("/members/{id}/ratings", owner.getMemberId()))
                .andExpect(status().isOk()).andExpect(content().json("[]"));
        assertThat(ratings.existsById(id)).isFalse();
    }

    @Test
    void duplicateRatingIs409AndDoesNotAddAnotherRow() throws Exception {
        ratings.saveAndFlush(new Rating(owner, 550L, 5, "원본"));
        long before = ratings.count();
        mvc.perform(post("/members/{id}/ratings", owner.getMemberId())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"movieId\":550,\"score\":4}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("RATING4091"));
        assertThat(ratings.count()).isEqualTo(before);
    }

    @Test
    void invalidRatingInputsAre400WithoutWrites() throws Exception {
        String[] invalidBodies = {"{}", "{\"movieId\":550}", "{\"movieId\":0,\"score\":3}",
                "{\"movieId\":550,\"score\":0}", "{\"movieId\":550,\"score\":6}",
                "{\"movieId\":550,\"score\":1.5}", "{\"movieId\":550.5,\"score\":3}",
                "{\"movieId\":550,\"score\":null}",
                json(Map.of("movieId", 550, "score", 3, "comment", "가".repeat(501)))};
        long before = ratings.count();
        for (String body : invalidBodies) {
            mvc.perform(post("/members/{id}/ratings", owner.getMemberId())
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("COMMON400"));
        }
        assertThat(ratings.count()).isEqualTo(before);
    }

    @Test
    void invalidPatchCannotChangeExistingRating() throws Exception {
        Rating saved = ratings.saveAndFlush(new Rating(owner, 550L, 5, "유지"));
        mvc.perform(patch("/members/{member}/ratings/{rating}", owner.getMemberId(), saved.getRatingId())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"score\":6,\"comment\":\"변경 금지\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("COMMON400"));
        Rating unchanged = ratings.findById(saved.getRatingId()).orElseThrow();
        assertThat(unchanged.getScore()).isEqualTo(5);
        assertThat(unchanged.getComment()).isEqualTo("유지");
    }

    @Test
    void anotherMemberCannotPatchOrDeleteOwnedRating() throws Exception {
        String suffix = suffix();
        Member other = members.saveAndFlush(new Member(suffix + "@example.com", "fixture-only", "다른" + suffix));
        Rating saved = ratings.saveAndFlush(new Rating(owner, 550L, 5, "보호된 후기"));
        mvc.perform(patch("/members/{member}/ratings/{rating}", other.getMemberId(), saved.getRatingId())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"score\":1}"))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("RATING4031"));
        mvc.perform(delete("/members/{member}/ratings/{rating}", other.getMemberId(), saved.getRatingId()))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("RATING4031"));
        assertThat(ratings.findById(saved.getRatingId()).orElseThrow().getScore()).isEqualTo(5);
    }

    @Test
    void missingMemberCannotCreateRating() throws Exception {
        mvc.perform(post("/members/{id}/ratings", Long.MAX_VALUE)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"movieId\":550,\"score\":3}"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("MEMBER4041"));
    }

    @Test
    void missingRatingPatchAndDeleteReturn404() throws Exception {
        mvc.perform(patch("/members/{member}/ratings/{rating}", owner.getMemberId(), Long.MAX_VALUE)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"score\":3}"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("RATING4041"));
        mvc.perform(delete("/members/{member}/ratings/{rating}", owner.getMemberId(), Long.MAX_VALUE))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("RATING4041"));
    }

    @Test
    void invalidPathAndUnreadableJsonUseSameErrorEnvelope() throws Exception {
        for (String id : new String[]{"0", "-1", "abc"}) {
            mvc.perform(post("/members/{id}/ratings", id).contentType(MediaType.APPLICATION_JSON)
                            .content("{\"movieId\":550,\"score\":3}"))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.isSuccess").value(false))
                    .andExpect(jsonPath("$.code").value("COMMON400"));
        }
        mvc.perform(post("/members").contentType(MediaType.APPLICATION_JSON).content("{broken"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.isSuccess").value(false))
                .andExpect(jsonPath("$.code").value("COMMON400")).andExpect(jsonPath("$.result").isEmpty());
        mvc.perform(post("/members/{id}/ratings", owner.getMemberId()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"movieId\":550,\"score\":\"not-a-number\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("COMMON400"));
    }

    @Test
    void optionalCommentCanBeNullAndScoreBoundariesAreAccepted() throws Exception {
        for (int score : new int[]{1, 5}) {
            mvc.perform(post("/members/{id}/ratings", owner.getMemberId()).contentType(MediaType.APPLICATION_JSON)
                            .content(json(Map.of("movieId", 1000 + score, "score", score))))
                    .andExpect(status().isCreated());
        }
        assertThat(ratings.findByMember_MemberIdOrderByRatingIdDesc(owner.getMemberId()))
                .hasSize(2).allSatisfy(rating -> assertThat(rating.getComment()).isNull());
    }

    @Test
    void readApisRemainCompatible() throws Exception {
        mvc.perform(get("/members/email/{email}", owner.getEmail())).andExpect(status().isOk())
                .andExpect(content().json("{\"available\":false}"));
        mvc.perform(get("/members/nickname/{nickname}", owner.getNickname())).andExpect(status().isOk())
                .andExpect(content().json("{\"available\":false}"));
    }

    @Test
    void patchPreflightAllowsJsonAndOnlyConfiguredOrigin() throws Exception {
        mvc.perform(options("/members/1/ratings/1").header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "PATCH")
                        .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
        mvc.perform(options("/members/1/ratings/1").header("Origin", "http://127.0.0.1:5173")
                        .header("Access-Control-Request-Method", "PATCH"))
                .andExpect(status().isForbidden()).andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void databaseUniqueConstraintStillMapsTo409WhenPrecheckMissesDuplicate() throws Exception {
        try {
            doReturn(false).when(members).existsByEmail(owner.getEmail());
            mvc.perform(post("/members").contentType(MediaType.APPLICATION_JSON).content(json(Map.of(
                            "email", owner.getEmail(), "password", "Umc!1234", "nickname", "경합" + suffix()))))
                    .andExpect(status().isConflict()).andExpect(jsonPath("$.isSuccess").value(false))
                    .andExpect(jsonPath("$.code").value("MEMBER4091"))
                    .andExpect(jsonPath("$.result").isEmpty());
            assertThat(members.findAll().stream().filter(member -> member.getEmail().equals(owner.getEmail())).count())
                    .isEqualTo(1);
        } finally {
            members.deleteById(owner.getMemberId());
        }
    }

    private String json(Object body) throws Exception { return mapper.writeValueAsString(body); }
    private String suffix() { return UUID.randomUUID().toString().substring(0, 8); }
}
