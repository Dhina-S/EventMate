package com.eventmate.eventmate_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String phoneNumber;
    private String role; 

    @Column(length = 1000)
    private String bio; 
    
    // ✅ FIX: Store only the Cloudinary URL (not raw Base64 data).
    // Base64 images are 500KB-2MB per user row — use the /api/images/upload endpoint
    // and save only the returned URL here.
    @Column(length = 500)
    private String profileImage;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_favorites",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "event_id")
    )
    private Set<Event> favorites = new HashSet<>();
}