package com.quickflow.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Swagger document metadata. No servers entry, so clients resolve paths against their own base URL. */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI quickflowOpenApi() {
        return new OpenAPI().info(new Info()
                .title("QuickFlow API")
                .version("v1")
                .description("Single-user productivity API: tasks, habits, learning resources, todo plans, dashboard, settings."));
    }
}
