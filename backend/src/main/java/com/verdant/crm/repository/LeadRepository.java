package com.verdant.crm.repository;

import com.verdant.crm.entity.Lead;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {
    Optional<Lead> findByLeadCode(String leadCode);

    @Query("SELECT l FROM Lead l WHERE " +
           "(CAST(:search AS string) IS NULL OR :search = '' OR " +
           "LOWER(l.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(l.company) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(l.email) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(l.leadCode) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) AND " +
           "(CAST(:status AS string) IS NULL OR :status = '' OR l.status = CAST(:status AS string)) AND " +
           "(:assignedId IS NULL OR (l.assignedUser IS NOT NULL AND l.assignedUser.id = :assignedId))")
    Page<Lead> searchLeads(@Param("search") String search,
                           @Param("status") String status,
                           @Param("assignedId") Long assignedId,
                           Pageable pageable);

    @Query("SELECT l FROM Lead l WHERE " +
           "LOWER(l.name) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
           "LOWER(l.company) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
           "LOWER(l.email) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
           "LOWER(l.leadCode) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%'))")
    List<Lead> globalSearch(@Param("q") String q, Pageable pageable);

    long countByStatus(String status);

    @Query("SELECT COUNT(l) FROM Lead l WHERE l.status = 'NEW' AND (l.lastContactedAt IS NULL)")
    long countUncontactedLeads();

    List<Lead> findByCustomerId(Long customerId);
}
