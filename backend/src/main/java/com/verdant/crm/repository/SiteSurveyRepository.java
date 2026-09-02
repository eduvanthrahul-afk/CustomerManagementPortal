package com.verdant.crm.repository;

import com.verdant.crm.entity.SiteSurvey;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SiteSurveyRepository extends JpaRepository<SiteSurvey, Long> {
    Optional<SiteSurvey> findBySurveyCode(String surveyCode);

    @Query("SELECT s FROM SiteSurvey s WHERE " +
           "(CAST(:search AS string) IS NULL OR :search = '' OR " +
           "LOWER(s.customer.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(s.address) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(s.surveyCode) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) AND " +
           "(CAST(:status AS string) IS NULL OR :status = '' OR s.status = CAST(:status AS string))")
    Page<SiteSurvey> searchSurveys(@Param("search") String search, @Param("status") String status, Pageable pageable);

    @Query("SELECT s FROM SiteSurvey s WHERE s.surveyDate >= :startDate ORDER BY s.surveyDate ASC")
    List<SiteSurvey> findUpcomingSurveys(@Param("startDate") LocalDate startDate, Pageable pageable);

    long countByStatus(String status);

    List<SiteSurvey> findByCustomerId(Long customerId);
}
