package com.shopline.controller;

import com.shopline.dto.Requests.ChangePasswordRequest;
import com.shopline.dto.Requests.LoginRequest;
import com.shopline.dto.Requests.RegisterRequest;
import com.shopline.http.Response;
import com.shopline.http.Router;
import com.shopline.model.Role;
import com.shopline.service.AuthService;

/** /api/auth/* — available to everyone (register, login) or any signed-in user (me, password). */
public final class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    public void register(Router router) {
        Role[] anyUser = Role.values();

        router.post("/api/auth/register", req -> Response.created(auth.register(req.body(RegisterRequest.class))));
        router.post("/api/auth/login", req -> auth.login(req.body(LoginRequest.class)));
        router.get("/api/auth/me", req -> req.user(), anyUser);
        router.put("/api/auth/password", req -> {
            auth.changePassword(req.user(), req.body(ChangePasswordRequest.class));
            return Response.noContent();
        }, anyUser);
    }
}
