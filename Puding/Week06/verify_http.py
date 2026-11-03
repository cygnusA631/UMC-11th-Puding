"""Verify the running Week06 API and prepare reproducible Postman requests.

Uses synthetic study accounts only. Leaves one demo rating for manual captures.
"""
from datetime import datetime
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import json
import os
import time

ROOT = Path(__file__).resolve().parent
RESULTS = ROOT / "results"
BASE = os.environ.get("API_BASE_URL", "http://localhost:8080")
PASSWORD = "Umc!1234"
TAG = str(time.time_ns())[-9:]
checks = []


def request(name, method, path, expected, body=None, code=None, headers=None):
    payload = None if body is None else json.dumps(body, ensure_ascii=False).encode()
    request_headers = {"Content-Type": "application/json", **(headers or {})}
    req = Request(BASE + path, data=payload, method=method, headers=request_headers)
    try:
        response = urlopen(req, timeout=15)
    except HTTPError as error:
        response = error
    with response:
        raw = response.read()
        status = response.status
        response_headers = dict(response.headers)
    data = json.loads(raw) if raw else None
    assert status == expected, (name, status, data)
    if code is not None:
        assert data["code"] == code, (name, data)
        assert set(data) == {"isSuccess", "code", "message", "result"}
        assert data["isSuccess"] is (expected < 400)
    if expected == 204:
        assert not raw, "204 must have an empty body"
    recorded_body = dict(body) if body else body
    if recorded_body and "password" in recorded_body:
        recorded_body["password"] = "[synthetic password omitted]"
    checks.append({"name": name, "method": method, "path": path,
                   "request": recorded_body, "status": status,
                   "response": data, "bodyBytes": len(raw),
                   "corsOrigin": response_headers.get("Access-Control-Allow-Origin")})
    print(f"PASS {status}: {name}")
    return data


def signup(email, nickname):
    return {"email": email, "password": PASSWORD, "nickname": nickname}


def main():
    RESULTS.mkdir(exist_ok=True)
    owner_body = signup(f"week6_{TAG}@example.com", f"푸딩{TAG}")
    owner = request("회원가입 성공", "POST", "/members", 201, owner_body, "COMMON201")
    assert set(owner["result"]) == {"memberId", "email", "nickname"}
    member_id = owner["result"]["memberId"]
    other = request("다른 회원 가입", "POST", "/members", 201,
                    signup(f"other6_{TAG}@example.com", f"다른{TAG}"), "COMMON201")
    other_id = other["result"]["memberId"]
    request("이메일 중복", "POST", "/members", 409,
            signup(owner_body["email"], f"새닉{TAG}"), "MEMBER4091")
    request("닉네임 중복", "POST", "/members", 409,
            signup(f"unused_{TAG}@example.com", owner_body["nickname"]), "MEMBER4092")
    for name, body in [
        ("잘못된 이메일", signup("not-email", "검증회원")),
        ("짧은 닉네임", signup("valid@example.com", "가")),
        ("약한 비밀번호", {**signup("valid@example.com", "검증회원"), "password": "weak"}),
        ("72바이트 초과 비밀번호", {**signup("valid@example.com", "검증회원"), "password": "Aa1!" + "가" * 23}),
    ]:
        request(name, "POST", "/members", 400, body, "COMMON400")
    path = f"/members/{member_id}/ratings"
    rating = {"movieId": 550, "score": 5, "comment": "6주차 저장 API 검증"}
    created = request("평점 등록", "POST", path, 201, rating, "COMMON201")
    rating_id = created["result"]
    request("평점 중복", "POST", path, 409, rating, "RATING4091")
    for name, body in [
        ("별점 0", {**rating, "movieId": 155, "score": 0}),
        ("별점 6", {**rating, "movieId": 155, "score": 6}),
        ("별점 누락", {"movieId": 155}),
        ("후기 501자", {**rating, "movieId": 155, "comment": "가" * 501}),
        ("영화 ID 0", {**rating, "movieId": 0}),
    ]:
        request(name, "POST", path, 400, body, "COMMON400")
    request("없는 회원 등록", "POST", "/members/9223372036854775807/ratings", 404,
            rating, "MEMBER4041")
    own = f"{path}/{rating_id}"
    update = {"score": 4, "comment": "수정 후 다시 조회"}
    request("다른 회원 수정 거절", "PATCH", f"/members/{other_id}/ratings/{rating_id}",
            403, update, "RATING4031")
    request("다른 회원 삭제 거절", "DELETE", f"/members/{other_id}/ratings/{rating_id}",
            403, code="RATING4031")
    request("평점 수정", "PATCH", own, 200, update, "COMMON200")
    rows = request("수정 결과 조회", "GET", path, 200)
    assert len(rows) == 1 and rows[0]["score"] == 4 and rows[0]["comment"] == update["comment"]
    request("없는 평점 수정", "PATCH", f"{path}/9223372036854775807", 404, update, "RATING4041")
    request("잘못된 경로 ID", "POST", "/members/abc/ratings", 400, rating, "COMMON400")
    request("PATCH 사전 요청", "OPTIONS", own, 200,
            headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "PATCH",
                     "Access-Control-Request-Headers": "content-type"})
    assert checks[-1]["corsOrigin"] == "http://localhost:5173"
    request("평점 삭제 (빈 본문)", "DELETE", own, 204)
    assert request("삭제 후 조회", "GET", path, 200) == []
    request("삭제된 평점 재삭제", "DELETE", own, 404, code="RATING4041")
    demo = request("캡처용 평점 재등록", "POST", path, 201, rating, "COMMON201")
    record = {"verifiedAt": datetime.now().astimezone().isoformat(), "database": "umc_movie_week06",
              "baseUrl": BASE, "passed": len(checks), "checks": checks,
              "captureDemo": {"memberId": member_id, "otherMemberId": other_id,
                              "ratingId": demo["result"], "email": owner_body["email"],
                              "nickname": owner_body["nickname"]},
              "screenshots": "User will capture and attach; none generated"}
    (RESULTS / "http-verification.json").write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
    make_collection()
    print(f"HTTP checks passed: {len(checks)}; demo member={member_id}, rating={demo['result']}")


def make_collection():
    def item(name, method, path, status, body=None, save=None, init=False):
        scripts = [f"pm.test('HTTP {status}', () => pm.response.to.have.status({status}));"]
        if status == 204:
            scripts.append("pm.test('Empty body', () => pm.expect(pm.response.text()).to.eql(''));")
        elif status >= 400:
            scripts.append("pm.test('Failure envelope', () => { const b=pm.response.json(); pm.expect(b.isSuccess).to.eql(false); pm.expect(b.result).to.eql(null); });")
        if save:
            scripts.append(save)
        events = [{"listen": "test", "script": {"type": "text/javascript", "exec": scripts}}]
        if init:
            events.insert(0, {"listen": "prerequest", "script": {"type": "text/javascript", "exec": [
                "pm.collectionVariables.set('runTag', String(Date.now()).slice(-8));"]}})
        req = {"method": method, "header": [], "url": "{{baseUrl}}" + path}
        if body is not None:
            req["header"] = [{"key": "Content-Type", "value": "application/json"}]
            req["body"] = {"mode": "raw", "raw": json.dumps(body, ensure_ascii=False, indent=2),
                           "options": {"raw": {"language": "json"}}}
        return {"name": name, "event": events, "request": req}

    user = signup("capture6_{{runTag}}@example.com", "푸딩{{runTag}}")
    path = "/members/{{memberId}}/ratings"
    own = path + "/{{ratingId}}"
    rate = {"movieId": 550, "score": 5, "comment": "6주차 실습"}
    update = {"score": 4, "comment": "수정 완료"}
    items = [
        item("01 회원가입 201", "POST", "/members", 201, user,
             "pm.collectionVariables.set('memberId', pm.response.json().result.memberId); pm.test('No password', () => pm.expect(pm.response.json().result).not.to.have.property('password'));", True),
        item("02 다른 회원 가입", "POST", "/members", 201,
             signup("other6_{{runTag}}@example.com", "다른{{runTag}}"),
             "pm.collectionVariables.set('otherMemberId', pm.response.json().result.memberId);"),
        item("03 이메일 중복 409", "POST", "/members", 409, {**user, "nickname": "새닉{{runTag}}"}),
        item("04 닉네임 중복 409", "POST", "/members", 409, {**user, "email": "unused6_{{runTag}}@example.com"}),
        item("05 이메일 검증 400", "POST", "/members", 400, {**user, "email": "not-email"}),
        item("06 평점 등록 201", "POST", path, 201, rate,
             "pm.collectionVariables.set('ratingId', pm.response.json().result);"),
        item("07 평점 중복 409", "POST", path, 409, rate),
        item("08 별점 검증 400", "POST", path, 400, {**rate, "movieId": 155, "score": 6}),
        item("09 타인 평점 수정 403", "PATCH", "/members/{{otherMemberId}}/ratings/{{ratingId}}", 403, update),
        item("10 타인 평점 삭제 403", "DELETE", "/members/{{otherMemberId}}/ratings/{{ratingId}}", 403),
        item("11 평점 수정 200", "PATCH", own, 200, update),
        item("12 수정 결과 조회", "GET", path, 200),
        item("13 없는 평점 수정 404", "PATCH", path + "/9223372036854775807", 404, update),
        item("14 평점 삭제 204", "DELETE", own, 204),
        item("15 삭제 후 빈 목록", "GET", path, 200, save="pm.test('Empty list', () => pm.expect(pm.response.json()).to.eql([]));"),
        item("16 삭제된 평점 재삭제 404", "DELETE", own, 404),
    ]
    collection = {"info": {"name": "UMC Week06 Spring Boot 저장 API", "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
                           "description": "01부터 순서대로 실행. 01 재실행 시 새 실습 회원을 생성하고 ID 변수를 갱신합니다. DB 제약 우회 재현은 통합 테스트 결과를 참고하세요."},
                  "variable": [{"key": "baseUrl", "value": BASE}, {"key": "runTag", "value": ""},
                               {"key": "memberId", "value": ""}, {"key": "otherMemberId", "value": ""}, {"key": "ratingId", "value": ""}],
                  "item": items}
    (RESULTS / "week06.postman_collection.json").write_text(json.dumps(collection, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
