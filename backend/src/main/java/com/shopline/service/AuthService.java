package com.shopline.service;

import com.shopline.dto.Requests.AuthResponse;
import com.shopline.dto.Requests.ChangePasswordRequest;
import com.shopline.dto.Requests.LoginRequest;
import com.shopline.dto.Requests.ProfileRequest;
import com.shopline.dto.Requests.RegisterRequest;
import com.shopline.http.ApiException;
import com.shopline.model.Role;
import com.shopline.model.User;
import com.shopline.model.VendorStatus;
import com.shopline.repository.UserRepository;
import com.shopline.security.JwtService;
import com.shopline.security.PasswordHasher;
import com.shopline.util.Log;
import com.shopline.util.Validation;

import java.util.Optional;

/** Sign-up, sign-in, sessions and account settings. */
public final class AuthService {

    private final UserRepository users;
    private final PasswordHasher hasher;
    private final JwtService jwt;
    /** Compared against when the email doesn't exist, so a login takes the same time either way. */
    private final String dummyHash;

    public AuthService(UserRepository users, PasswordHasher hasher, JwtService jwt) {
        this.users = users;
        this.hasher = hasher;
        this.jwt = jwt;
        this.dummyHash = hasher.hash("not-a-real-password");
    }

    public AuthResponse register(RegisterRequest request) {
        String name = Validation.required(request.name(), "Name", 100);
        String email = Validation.email(request.email());
        String password = Validation.password(request.password(), "Password");

        Role role = request.role() == null ? Role.CUSTOMER : Role.parse(request.role());
        if (role != Role.CUSTOMER && role != Role.VENDOR) {
            // Admin accounts can't be self-registered.
            throw ApiException.badRequest("Choose either a customer or a vendor account");
        }
        if (users.findByEmail(email).isPresent()) {
            throw ApiException.conflict("An account with this email already exists");
        }

        VendorStatus vendorStatus = role == Role.VENDOR ? VendorStatus.PENDING : null;
        User user = users.create(name, email, hasher.hash(password), role, vendorStatus);
        Log.info("New %s account: id=%d", role.value(), user.id());
        return new AuthResponse(jwt.issue(user.id(), role.value()), user);
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.email() == null ? "" : request.email().trim().toLowerCase();
        String password = request.password() == null ? "" : request.password();

        Optional<User> user = users.findByEmail(email);
        boolean valid = hasher.matches(password, user.map(User::passwordHash).orElse(dummyHash));
        if (user.isEmpty() || !valid) {
            throw ApiException.unauthorized("Invalid email or password");
        }
        User u = user.get();
        return new AuthResponse(jwt.issue(u.id(), u.role().value()), u);
    }

    /** Resolves a bearer token to the current user. The user is re-read so deleted accounts lose access at once. */
    public User authenticate(String token) {
        long userId = jwt.verify(token)
                .orElseThrow(() -> ApiException.unauthorized("Your session has expired. Please sign in again."));
        return users.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("Your session has expired. Please sign in again."));
    }

    public void changePassword(User user, ChangePasswordRequest request) {
        if (!hasher.matches(request.currentPassword(), user.passwordHash())) {
            throw ApiException.badRequest("Current password is incorrect");
        }
        String newPassword = Validation.password(request.newPassword(), "New password");
        users.updatePassword(user.id(), hasher.hash(newPassword));
    }

    public User updateProfile(User user, ProfileRequest request) {
        String name = Validation.required(request.name(), "Name", 100);
        String email = Validation.email(request.email());
        String phone = Validation.optional(request.phone(), "Phone", 30);
        String address = Validation.optional(request.address(), "Address", 300);

        if (!email.equals(user.email()) && users.findByEmail(email).isPresent()) {
            throw ApiException.conflict("Another account already uses this email");
        }
        return users.updateProfile(user.id(), name, email, phone, address);
    }

    /** Creates the first admin account from environment variables, if it doesn't exist yet. */
    public void ensureAdmin(String name, String email, String password) {
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            Log.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set; no admin account was created");
            return;
        }
        String normalized = email.trim().toLowerCase();
        Optional<User> existing = users.findByEmail(normalized);
        if (existing.isPresent()) {
            if (existing.get().role() != Role.ADMIN) {
                Log.warn("ADMIN_EMAIL %s belongs to a non-admin account; not changing it", normalized);
            }
            return;
        }
        Validation.password(password, "ADMIN_PASSWORD");
        users.create(name, normalized, hasher.hash(password), Role.ADMIN, null);
        Log.info("Created admin account %s", normalized);
    }
}
