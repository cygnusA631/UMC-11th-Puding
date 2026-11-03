package com.umc.movie.exception;

import com.umc.movie.dto.ApiResponse;
import java.util.stream.Collectors;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Void>> handleApiException(ApiException exception) {
        return ResponseEntity.status(exception.getStatus())
                .body(ApiResponse.failure(exception.getCode(), exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleBodyValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getAllErrors().stream()
                .map(error -> error.getDefaultMessage()).distinct().sorted().collect(Collectors.joining(", "));
        return badRequest(message);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodValidation(HandlerMethodValidationException exception) {
        String message = exception.getAllErrors().stream()
                .map(error -> error.getDefaultMessage()).distinct().sorted().collect(Collectors.joining(", "));
        return badRequest(message);
    }

    @ExceptionHandler(jakarta.validation.ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintValidation(
            jakarta.validation.ConstraintViolationException exception) {
        String message = exception.getConstraintViolations().stream()
                .map(violation -> violation.getMessage()).distinct().sorted().collect(Collectors.joining(", "));
        return badRequest(message);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch() {
        return badRequest("경로 ID는 양의 정수여야 합니다.");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnreadableBody() {
        return badRequest("JSON 형식과 필드 자료형을 확인해주세요.");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleIntegrity(DataIntegrityViolationException exception) {
        return switch (constraintName(exception)) {
            case "uk_member_email" -> conflict("MEMBER4091", "이미 사용 중인 이메일입니다.");
            case "uk_member_nickname" -> conflict("MEMBER4092", "이미 사용 중인 닉네임입니다.");
            case "uk_rating_member_movie" -> conflict("RATING4091", "이미 이 영화에 평점을 남기셨습니다.");
            default -> ResponseEntity.internalServerError()
                    .body(ApiResponse.failure("COMMON500", "데이터 저장 중 오류가 발생했습니다."));
        };
    }

    private String constraintName(Throwable exception) {
        Throwable current = exception;
        for (int depth = 0; current != null && depth < 20; depth++, current = current.getCause()) {
            if (current instanceof ConstraintViolationException violation && violation.getConstraintName() != null) {
                String name = violation.getConstraintName().replace("`", "").replace("'", "").replace("\"", "");
                return name.substring(name.lastIndexOf('.') + 1);
            }
        }
        return "";
    }

    private ResponseEntity<ApiResponse<Void>> badRequest(String message) {
        return ResponseEntity.badRequest().body(ApiResponse.failure("COMMON400", message));
    }

    private ResponseEntity<ApiResponse<Void>> conflict(String code, String message) {
        return ResponseEntity.status(409).body(ApiResponse.failure(code, message));
    }
}
