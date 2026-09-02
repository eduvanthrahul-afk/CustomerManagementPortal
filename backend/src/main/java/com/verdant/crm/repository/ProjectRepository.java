package com.verdant.crm.repository;

import com.verdant.crm.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Optional<Project> findByProjectNumber(String projectNumber);

    @Query("SELECT p FROM Project p WHERE " +
           "(CAST(:search AS string) IS NULL OR :search = '' OR " +
           "LOWER(p.projectName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(p.customer.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(p.projectNumber) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) AND " +
           "(CAST(:status AS string) IS NULL OR :status = '' OR p.status = CAST(:status AS string))")
    Page<Project> searchProjects(@Param("search") String search, @Param("status") String status, Pageable pageable);

    @Query("SELECT p FROM Project p WHERE " +
           "LOWER(p.projectName) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
           "LOWER(p.projectNumber) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
           "LOWER(p.customer.name) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%'))")
    List<Project> globalSearch(@Param("q") String q, Pageable pageable);

    long countByStatus(String status);

    @Query("SELECT COALESCE(SUM(p.budget), 0) FROM Project p WHERE p.status = 'DELAYED'")
    BigDecimal sumBudgetDelayedProjects();

    @Query("SELECT p FROM Project p WHERE p.status = 'DELAYED'")
    List<Project> findDelayedProjects();

    List<Project> findByCustomerId(Long customerId);
}
