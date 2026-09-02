package com.verdant.crm.repository;

import com.verdant.crm.entity.Quote;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuoteRepository extends JpaRepository<Quote, Long> {
    Optional<Quote> findByQuoteNumber(String quoteNumber);

    @Query("SELECT q FROM Quote q WHERE " +
           "(CAST(:search AS string) IS NULL OR :search = '' OR " +
           "LOWER(q.customer.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(q.projectType) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(q.quoteNumber) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) AND " +
           "(CAST(:status AS string) IS NULL OR :status = '' OR q.status = CAST(:status AS string))")
    Page<Quote> searchQuotes(@Param("search") String search, @Param("status") String status, Pageable pageable);

    @Query("SELECT q FROM Quote q WHERE " +
           "LOWER(q.quoteNumber) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
           "LOWER(q.projectType) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
           "LOWER(q.customer.name) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%'))")
    List<Quote> globalSearch(@Param("q") String q, Pageable pageable);

    long countByStatus(String status);

    @Query("SELECT COUNT(q) FROM Quote q WHERE q.status IN ('SENT', 'VIEWED')")
    long countUnfollowedQuotes();

    @Query("SELECT COALESCE(SUM(q.amount), 0) FROM Quote q WHERE q.status IN ('SENT', 'VIEWED')")
    BigDecimal sumAmountUnfollowedQuotes();

    @Query("SELECT COUNT(q) FROM Quote q WHERE q.amount > 0 AND ((q.amount - q.cost) / q.amount) < 0.15 AND q.status != 'REJECTED'")
    long countLowMarginQuotes();

    @Query("SELECT q FROM Quote q WHERE q.status IN ('SENT', 'VIEWED') ORDER BY q.createdAt ASC")
    List<Quote> findQuotesNeedingDecision(Pageable pageable);

    List<Quote> findByCustomerId(Long customerId);
}
