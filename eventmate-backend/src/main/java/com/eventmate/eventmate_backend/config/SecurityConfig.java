package com.eventmate.eventmate_backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // ✅ FIX: Enables @PreAuthorize annotations on controllers
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private UserDetailsService userDetailsService;

    @org.springframework.beans.factory.annotation.Value("${cors.allowed-origins}")
    private List<String> allowedOrigins;

    // ✅ CRITICAL: Authentication Provider (Required for Login to work)
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    // ✅ CRITICAL: Authentication Manager (Required for Login to work)
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // ✅ CRITICAL: Password Encoder (Required for Login to work)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                // ✅ 1. Public Access (Login/Register)
                .requestMatchers("/api/auth/**", "/auth/**").permitAll()
                
                // ✅ 2. Read-Only Public Data (Events, Reviews, Seats, Showtimes)
                .requestMatchers(HttpMethod.GET, "/api/events").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/events/search").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/events/recommendations/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/events/{id:\\d+}").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/reviews/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/seats/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/showtimes/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/admin/predict/**").permitAll()

                // ✅ 3. AI Chat (Public for Guests)
                .requestMatchers("/api/ai/chat").permitAll()

                // ✅ 4. Admin & Organizer Endpoints (defense-in-depth alongside @PreAuthorize)
                .requestMatchers(HttpMethod.POST, "/api/showtimes/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_ORGANIZER")
                .requestMatchers(HttpMethod.DELETE, "/api/showtimes/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_ORGANIZER")
                .requestMatchers(HttpMethod.POST, "/api/images/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_ORGANIZER")
                .requestMatchers("/api/events/my-events").hasAnyAuthority("ROLE_ADMIN", "ROLE_ORGANIZER")
                .requestMatchers(HttpMethod.POST, "/api/events/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_ORGANIZER")
                .requestMatchers(HttpMethod.PUT, "/api/events/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_ORGANIZER")
                .requestMatchers(HttpMethod.DELETE, "/api/events/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_ORGANIZER")
                .requestMatchers("/api/admin/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_ORGANIZER")
                .requestMatchers("/api/ai/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_ORGANIZER")

                // 5. Lock Everything Else
                .anyRequest().authenticated()
            )
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}