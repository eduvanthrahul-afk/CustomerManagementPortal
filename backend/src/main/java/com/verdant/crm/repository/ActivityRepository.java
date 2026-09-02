package com.verdant.crm.repository;

import com.verdant.crm.entity.Activity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {
    @Query("SELECT a FROM Activity a ORDER BY a.createdAt DESC")
    List<Activity> findRecentActivities(Pageable pageable);
}
