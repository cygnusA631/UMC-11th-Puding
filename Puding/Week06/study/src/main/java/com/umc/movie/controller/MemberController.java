package com.umc.movie.controller;

import com.umc.movie.dto.EmailCheckResponse;
import com.umc.movie.dto.NicknameCheckResponse;
import com.umc.movie.dto.ApiResponse;
import com.umc.movie.dto.MemberResponse;
import com.umc.movie.dto.SignUpRequest;
import com.umc.movie.service.MemberService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/members")
public class MemberController {
    private final MemberService memberService;

    @PostMapping
    public ResponseEntity<ApiResponse<MemberResponse>> signUp(@Valid @RequestBody SignUpRequest request) {
        return ResponseEntity.status(201).body(ApiResponse.created(
                "회원가입에 성공했습니다.", memberService.signUp(request)));
    }

    @GetMapping("/nickname/{nickname}")
    public NicknameCheckResponse checkNickname(@PathVariable
            @NotBlank(message = "닉네임은 공백일 수 없습니다.")
            @Size(min = 2, max = 12, message = "닉네임은 2~12자여야 합니다.") String nickname) {
        return memberService.checkNickname(nickname);
    }

    @GetMapping("/email/{email}")
    public EmailCheckResponse checkEmail(@PathVariable
            @NotBlank(message = "이메일은 공백일 수 없습니다.")
            @Email(message = "이메일 형식이 올바르지 않습니다.")
            @Size(max = 254, message = "이메일은 254자 이하여야 합니다.") String email) {
        return memberService.checkEmail(email);
    }
}
