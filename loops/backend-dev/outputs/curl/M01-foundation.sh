#!/usr/bin/env bash
# M01 Foundation smoke suite: health, Swagger, ProblemDetail 404, CORS.
source "$(dirname "$0")/_lib.sh"

req GET "$ROOT_URL/actuator/health"
expect_status A1 "health 200" 200
expect_json   A1 "health UP" '.status' UP

req GET "$ROOT_URL/v3/api-docs"
expect_status A2 "api-docs 200" 200
expect_json   A2 "api-docs title" '.info.title' "QuickFlow API"

req GET "$ROOT_URL/swagger-ui.html"
expect_status A3 "swagger-ui 200/302" "200|302"

req GET "/does-not-exist"
expect_status A4 "unknown route 404" 404
expect_header A4 "problem+json content type" Content-Type "application/problem+json"
expect_json   A4 "problem status field" '.status' 404

req OPTIONS "/x" "" -H 'Origin: http://localhost:4200' -H 'Access-Control-Request-Method: GET'
expect_header A5 "CORS allow-origin echoed" Access-Control-Allow-Origin "http://localhost:4200"

summary
