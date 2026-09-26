package com.quickflow.common.config;

import java.util.Map;
import java.util.TreeMap;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.IntegerSchema;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.ObjectSchema;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.media.StringSchema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;

import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Swagger document metadata. No servers entry, so clients resolve paths against their own base URL. */
@Configuration
public class OpenApiConfig {

    static final String PROBLEM = "ProblemDetail";

    @Bean
    public OpenAPI quickflowOpenApi() {
        return new OpenAPI().info(new Info()
                .title("QuickFlow API")
                .version("v1")
                .description("Single-user productivity API: tasks, habits, learning resources, todo plans, dashboard, settings."));
    }

    /**
     * Fixes two springdoc defaults (M08): an operation with any {@code @ApiResponse} annotation loses its implicit
     * success response, and annotated error responses get the method's return schema. Here every operation gets a
     * 2xx (200 with the return schema when none is declared) and every 4xx/5xx becomes an RFC 7807 ProblemDetail.
     */
    @Bean
    public OpenApiCustomizer problemDetailResponses() {
        return openApi -> {
            if (openApi.getComponents() == null) {
                openApi.setComponents(new Components());
            }
            openApi.getComponents().addSchemas(PROBLEM, problemDetailSchema());
            if (openApi.getPaths() != null) {
                openApi.getPaths().values().forEach(item -> item.readOperations().forEach(OpenApiConfig::fixResponses));
            }
        };
    }

    private static void fixResponses(Operation op) {
        ApiResponses responses = op.getResponses();
        if (responses == null) {
            return;
        }
        boolean hasSuccess = responses.keySet().stream().anyMatch(code -> code.startsWith("2"));
        if (!hasSuccess) {
            // springdoc copied the return type into the annotated error responses; reuse it for the 200
            Schema<?> returned = responses.values().stream()
                    .map(ApiResponse::getContent)
                    .filter(c -> c != null && !c.isEmpty())
                    .map(c -> c.values().iterator().next().getSchema())
                    .findFirst().orElse(null);
            ApiResponse ok = new ApiResponse().description("OK");
            if (returned != null) {
                ok.setContent(new Content().addMediaType("application/json", new MediaType().schema(returned)));
            }
            responses.addApiResponse("200", ok);
        }
        Content problem = new Content().addMediaType("application/problem+json",
                new MediaType().schema(new Schema<>().$ref("#/components/schemas/" + PROBLEM)));
        responses.forEach((code, r) -> {
            if (code.startsWith("4") || code.startsWith("5")) {
                r.setContent(problem);
            }
        });
        Map<String, ApiResponse> sorted = new TreeMap<>(responses);
        responses.clear();
        sorted.forEach(responses::addApiResponse);
    }

    private static Schema<?> problemDetailSchema() {
        return new ObjectSchema()
                .description("RFC 7807 error body (D-05)")
                .addProperty("type", new StringSchema().example("about:blank"))
                .addProperty("title", new StringSchema().example("Validation failed"))
                .addProperty("status", new IntegerSchema().example(400))
                .addProperty("detail", new StringSchema().example("One or more fields are invalid"))
                .addProperty("instance", new StringSchema().example("/api/v1/tasks"))
                .addProperty("errors", new ObjectSchema()
                        .description("Field name → message; present on validation and business-rule errors")
                        .additionalProperties(new StringSchema())
                        .example(Map.of("title", "Title is required")));
    }
}
