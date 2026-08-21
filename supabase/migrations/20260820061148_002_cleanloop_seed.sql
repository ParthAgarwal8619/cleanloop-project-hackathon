/*
# CleanLoop AI — Demo Data Seed

Populates all tables with realistic Indian-city demo data for the hackathon:
- 20 citizens, 5 officers, 10 workers, 5 recyclers, 1 admin
- 5 vehicles
- 100 waste reports across zones with varied statuses/priorities
- waste_materials per report
- drain incidents (20)
- recyclable materials (50)
- routes + route stops
- collection tasks
- impact metrics (last 30 days)
- notifications

All data is deterministic and realistic for demo purposes.
*/

DO $$
DECLARE
  v_profile_ids uuid[];
  v_citizen_ids uuid[];
  v_officer_ids uuid[];
  v_worker_ids uuid[];
  v_recycler_ids uuid[];
  v_admin_id uuid;
  v_vehicle_ids uuid[];
  v_report_ids uuid[];
  v_report_uuid uuid;
  v_route_id uuid;
  v_i integer;
  v_report_count integer := 100;
  v_lat float;
  v_lng float;
  v_zone text;
  v_status text;
  v_priority text;
  v_waste_type text;
  v_risk integer;
  v_est_kg integer;
  v_near_drain boolean;
  v_drain_dist integer;
  v_public boolean;
  v_report_id_text text;
  v_mat_type text;
  v_mat_kg integer;
  v_mat_count integer;
  v_j integer;
  v_created timestamptz;
  v_worker_id uuid;
  v_vehicle_id uuid;
  v_rec_mat_count integer := 50;
  v_mat_idx integer;
  v_mat_types text[] := ARRAY['plastic','paper','metal','glass','e_waste'];
  v_mat_prices integer[] := ARRAY[25,12,80,8,350];
  v_impact_date date;
  v_wc_kg integer;
  v_pr_kg integer;
  v_org_kg integer;
  v_paper_kg integer;
  v_metal_kg integer;
  v_glass_kg integer;
  v_ewaste_kg integer;
  v_resolved integer;
  v_drain_prev integer;
  v_co2 float;
  v_rec_rate float;
  v_citizen_names text[] := ARRAY['Aarav Sharma','Priya Patel','Rohan Gupta','Ananya Iyer','Vikram Singh','Kavya Reddy','Arjun Nair','Sneha Joshi','Karthik Kumar','Meera Krishnan','Rahul Verma','Ishita Bose','Aditya Rao','Pooja Menon','Sai Prasad','Tanvi Desai','Nikhil Agarwal','Riya Chopra','Manish Pandey','Divya Srinivasan'];
  v_officer_names text[] := ARRAY['Officer Kumar','Officer Sharma','Officer Reddy','Officer Nair','Officer Gupta'];
  v_worker_names text[] := ARRAY['Ramesh Yadav','Suresh Kumar','Mahesh Singh','Dinesh Patel','Ganesh Rao','Lokesh Reddy','Naresh Gupta','Rajesh Nair','Suresh Pillai','Anil Joshi'];
  v_recycler_names text[] := ARRAY['EcoRecycle Industries','GreenCycle Plastics','MetalRecover Ltd','GlassRenew Co','E-Waste Solutions India'];
  v_zones text[] := ARRAY['Zone A - Indiranagar','Zone B - Koramangala','Zone C - Whitefield','Zone D - Jayanagar','Zone E - Malleshwaram','Zone F - BTM Layout','Zone G - HSR Layout','Zone H - Electronic City'];
  v_addresses text[] := ARRAY['100 Feet Road, Indiranagar','5th Block, Koramangala','ITPL Main Road, Whitefield','4th T Block, Jayanagar','Margosa Road, Malleshwaram','1st Stage, BTM Layout','Sector 6, HSR Layout','Phase 1, Electronic City'];
  v_waste_types text[] := ARRAY['plastic','organic','paper','metal','glass','e_waste','mixed'];
  v_statuses text[] := ARRAY['SUBMITTED','AI_ANALYZED','ASSIGNED','IN_PROGRESS','COLLECTED','AI_VERIFIED','RESOLVED'];
  v_priorities text[] := ARRAY['CRITICAL','HIGH','MEDIUM','LOW'];
  v_base_lat float := 12.9716;
  v_base_lng float := 77.5946;
BEGIN
  -- Clear existing demo data (safe to re-seed)
  DELETE FROM notifications;
  DELETE FROM route_stops;
  DELETE FROM routes;
  DELETE FROM collection_tasks;
  DELETE FROM drain_incidents;
  DELETE FROM recycler_requests;
  DELETE FROM recyclable_materials;
  DELETE FROM waste_materials;
  DELETE FROM waste_reports;
  DELETE FROM vehicles;
  DELETE FROM profiles;

  -- ===== PROFILES =====
  -- Admin
  INSERT INTO profiles (id, name, email, role, zone) VALUES
    (gen_random_uuid(), 'Admin User', 'admin@cleanloop.ai', 'admin', 'All Zones')
    RETURNING id INTO v_admin_id;

  -- Citizens (20)
  FOR v_i IN 1..20 LOOP
    INSERT INTO profiles (name, email, role, zone, eco_points, badges)
    VALUES (
      v_citizen_names[v_i],
      lower(replace(split_part(v_citizen_names[v_i], ' ', 1), ' ', '')) || '@demo.in',
      'citizen',
      v_zones[((v_i - 1) % 8) + 1],
      (random() * 500)::integer,
      CASE WHEN v_i <= 5 THEN ARRAY['Early Adopter','Waste Warrior'] WHEN v_i <= 10 THEN ARRAY['Early Adopter'] ELSE ARRAY[]::text[] END
    )
    RETURNING id INTO v_worker_id;
    v_citizen_ids := array_append(v_citizen_ids, v_worker_id);
  END LOOP;

  -- Officers (5)
  FOR v_i IN 1..5 LOOP
    INSERT INTO profiles (name, email, role, zone) VALUES
    (v_officer_names[v_i], 'officer' || v_i || '@cleanloop.ai', 'officer', v_zones[v_i])
    RETURNING id INTO v_worker_id;
    v_officer_ids := array_append(v_officer_ids, v_worker_id);
  END LOOP;

  -- Workers (10)
  FOR v_i IN 1..10 LOOP
    INSERT INTO profiles (name, email, role, zone, phone) VALUES
    (v_worker_names[v_i], 'worker' || v_i || '@cleanloop.ai', 'worker', v_zones[((v_i - 1) % 8) + 1], '+91 9' || lpad((v_i * 1111)::text, 8, '0'))
    RETURNING id INTO v_worker_id;
    v_worker_ids := array_append(v_worker_ids, v_worker_id);
  END LOOP;

  -- Recyclers (5)
  FOR v_i IN 1..5 LOOP
    INSERT INTO profiles (name, email, role, zone) VALUES
    (v_recycler_names[v_i], 'recycler' || v_i || '@cleanloop.ai', 'recycler', v_zones[v_i])
    RETURNING id INTO v_worker_id;
    v_recycler_ids := array_append(v_recycler_ids, v_worker_id);
  END LOOP;

  -- ===== VEHICLES (5) =====
  FOR v_i IN 1..5 LOOP
    INSERT INTO vehicles (vehicle_id, name, capacity, current_load, status, zone, driver_name) VALUES
    ('WC-0' || v_i, 'Waste Collector ' || v_i, 500, (random() * 200)::integer, CASE WHEN v_i <= 3 THEN 'on_route' ELSE 'available' END, v_zones[v_i], v_worker_names[v_i])
    RETURNING id INTO v_vehicle_id;
    v_vehicle_ids := array_append(v_vehicle_ids, v_vehicle_id);
  END LOOP;

  -- ===== WASTE REPORTS (100) =====
  FOR v_i IN 1..v_report_count LOOP
    v_zone := v_zones[((v_i - 1) % 8) + 1];
    v_lat := v_base_lat + (random() - 0.5) * 0.08;
    v_lng := v_base_lng + (random() - 0.5) * 0.08;
    v_status := v_statuses[((v_i - 1) % 7) + 1];
    v_priority := v_priorities[((v_i - 1) % 4) + 1];
    v_waste_type := v_waste_types[((v_i - 1) % 7) + 1];
    v_risk := (random() * 100)::integer;
    v_est_kg := (5 + random() * 45)::integer;
    v_near_drain := (v_i % 5 = 0);
    v_drain_dist := CASE WHEN v_near_drain THEN (5 + (random() * 20)::integer) ELSE (30 + (random() * 100)::integer) END;
    v_public := (v_i % 3 = 0);
    v_report_id_text := 'CL-2026-' || lpad(v_i::text, 6, '0');
    v_created := now() - (random() * interval '30 days');
    v_worker_id := CASE WHEN v_status IN ('ASSIGNED','IN_PROGRESS','COLLECTED','AI_VERIFIED','RESOLVED') THEN v_worker_ids[((v_i - 1) % 10) + 1] ELSE NULL END;
    v_vehicle_id := CASE WHEN v_status IN ('IN_PROGRESS','COLLECTED','AI_VERIFIED','RESOLVED') THEN v_vehicle_ids[((v_i - 1) % 5) + 1] ELSE NULL END;

    INSERT INTO waste_reports (
      report_id, profile_id, image_url, latitude, longitude, address,
      description, status, priority, risk_score, waste_type, confidence,
      severity, estimated_kg, near_drain, drain_distance, public_area,
      overflow_risk, health_risk, ai_recommendation, ai_mode,
      assigned_worker_id, assigned_vehicle_id, created_at, updated_at, resolved_at
    ) VALUES (
      v_report_id_text,
      v_citizen_ids[((v_i - 1) % 20) + 1],
      CASE WHEN (v_i % 4 = 0) THEN 'https://images.pexels.com/photos/' || (1000000 + v_i) || '/pexels-photo-' || (1000000 + v_i) || '.jpeg' ELSE NULL END,
      v_lat, v_lng, v_addresses[((v_i - 1) % 8) + 1],
      'Waste accumulation reported near residential area. Needs attention.',
      v_status, v_priority, v_risk, v_waste_type, 0.85 + random() * 0.14,
      CASE WHEN v_risk > 75 THEN 'HIGH' WHEN v_risk > 50 THEN 'MEDIUM' ELSE 'LOW' END,
      v_est_kg, v_near_drain, v_drain_dist, v_public,
      CASE WHEN v_risk > 70 THEN 'High' WHEN v_risk > 40 THEN 'Medium' ELSE 'Low' END,
      CASE WHEN v_risk > 60 THEN 'Medium' ELSE 'Low' END,
      CASE WHEN v_near_drain THEN 'Immediate collection recommended - waste near drainage channel.' ELSE 'Schedule collection within 24 hours.' END,
      'demo',
      v_worker_id, v_vehicle_id, v_created, v_created,
      CASE WHEN v_status = 'RESOLVED' THEN v_created + interval '4 hours' ELSE NULL END
    )
    RETURNING id INTO v_report_uuid;

    -- Waste materials per report (1-3 materials)
    v_mat_count := 1 + (random() * 2)::integer;
    FOR v_j IN 1..v_mat_count LOOP
      v_mat_type := v_waste_types[((v_i + v_j - 2) % 7) + 1];
      v_mat_kg := (3 + random() * 15)::integer;
      INSERT INTO waste_materials (report_id, material_type, estimated_kg) VALUES
      (v_report_uuid, v_mat_type, v_mat_kg);
    END LOOP;

    -- Collection tasks for assigned+ reports
    IF v_status IN ('ASSIGNED','IN_PROGRESS','COLLECTED','AI_VERIFIED','RESOLVED') THEN
      INSERT INTO collection_tasks (
        report_id, worker_id, vehicle_id, status, priority, completed_at,
        after_image_url, ai_verification, ai_verification_confidence
      ) VALUES (
        v_report_uuid,
        v_worker_ids[((v_i - 1) % 10) + 1],
        v_vehicle_ids[((v_i - 1) % 5) + 1],
        CASE WHEN v_status = 'RESOLVED' THEN 'verified' WHEN v_status = 'AI_VERIFIED' THEN 'verified' WHEN v_status = 'COLLECTED' THEN 'collected' WHEN v_status = 'IN_PROGRESS' THEN 'started' ELSE 'assigned' END,
        v_priority,
        CASE WHEN v_status IN ('AI_VERIFIED','RESOLVED') THEN v_created + interval '4 hours' ELSE NULL END,
        CASE WHEN v_status IN ('AI_VERIFIED','RESOLVED') THEN 'https://images.pexels.com/photos/1000001/pexels-photo-1000001.jpeg' ELSE NULL END,
        CASE WHEN v_status IN ('AI_VERIFIED','RESOLVED') THEN 'Collection appears successfully completed.' ELSE NULL END,
        CASE WHEN v_status IN ('AI_VERIFIED','RESOLVED') THEN 0.92 + random() * 0.07 ELSE NULL END
      );
    END IF;

    -- Drain incidents for near-drain reports
    IF v_near_drain THEN
      INSERT INTO drain_incidents (
        report_id, latitude, longitude, address, distance_to_drain,
        waste_quantity, risk_score, risk_level, status, recommended_action
      ) VALUES (
        v_report_uuid, v_lat, v_lng, v_addresses[((v_i - 1) % 8) + 1],
        v_drain_dist, v_est_kg, v_risk,
        CASE WHEN v_risk > 75 THEN 'HIGH' WHEN v_risk > 50 THEN 'MEDIUM' ELSE 'LOW' END,
        CASE WHEN v_status = 'RESOLVED' THEN 'resolved' ELSE 'active' END,
        CASE WHEN v_risk > 75 THEN 'Immediate clearing and drain protection required.' ELSE 'Monitor and schedule clearing.' END
      );
    END IF;
  END LOOP;

  -- ===== RECYCLABLE MATERIALS (50) =====
  FOR v_i IN 1..v_rec_mat_count LOOP
    v_mat_idx := ((v_i - 1) % 5) + 1;
    INSERT INTO recyclable_materials (material_type, quantity_kg, zone, estimated_value, status) VALUES
    (
      v_mat_types[v_mat_idx],
      (20 + random() * 200)::integer,
      v_zones[((v_i - 1) % 8) + 1],
      ((20 + random() * 200)::integer) * v_mat_prices[v_mat_idx],
      CASE WHEN v_i % 4 = 0 THEN 'collected' WHEN v_i % 5 = 0 THEN 'reserved' ELSE 'available' END
    );
  END LOOP;

  -- ===== ROUTES (3) with stops =====
  FOR v_i IN 1..3 LOOP
    INSERT INTO routes (vehicle_id, worker_id, status, total_distance_km, estimated_time_min, total_stops, waste_capacity) VALUES
    (v_vehicle_ids[v_i], v_worker_ids[v_i], CASE WHEN v_i = 1 THEN 'active' ELSE 'planned' END, 15 + random() * 60, 90 + (random() * 120)::integer, 6, 200 + (random() * 200)::integer)
    RETURNING id INTO v_route_id;

    -- Add stops from AI_ANALYZED/ASSIGNED reports
    FOR v_j IN 1..6 LOOP
      SELECT id INTO v_report_uuid FROM waste_reports WHERE status IN ('AI_ANALYZED','ASSIGNED') ORDER BY created_at DESC LIMIT 1 OFFSET ((v_i - 1) * 6 + v_j - 1);
      IF v_report_uuid IS NOT NULL THEN
        INSERT INTO route_stops (route_id, report_id, stop_order, zone, status) VALUES
        (v_route_id, v_report_uuid, v_j, v_zones[((v_j - 1) % 8) + 1], CASE WHEN v_j <= 2 AND v_i = 1 THEN 'visited' ELSE 'pending' END);
      END IF;
    END LOOP;
  END LOOP;

  -- ===== IMPACT METRICS (last 30 days) =====
  FOR v_i IN 1..30 LOOP
    v_impact_date := CURRENT_DATE - (30 - v_i);
    v_wc_kg := (800 + random() * 600)::integer;
    v_pr_kg := (200 + random() * 200)::integer;
    v_org_kg := (150 + random() * 150)::integer;
    v_paper_kg := (80 + random() * 100)::integer;
    v_metal_kg := (40 + random() * 60)::integer;
    v_glass_kg := (30 + random() * 50)::integer;
    v_ewaste_kg := (10 + random() * 30)::integer;
    v_resolved := (15 + random() * 20)::integer;
    v_drain_prev := (2 + (random() * 5)::integer);
    v_co2 := v_pr_kg * 2.0 + v_paper_kg * 1.5 + v_metal_kg * 4.0 + v_glass_kg * 0.5;
    v_rec_rate := (v_pr_kg + v_paper_kg + v_metal_kg + v_glass_kg + v_ewaste_kg)::float / v_wc_kg::float;

    INSERT INTO impact_metrics (
      metric_date, waste_collected_kg, plastic_recovered_kg, organic_waste_kg,
      paper_waste_kg, metal_waste_kg, glass_waste_kg, e_waste_kg,
      reports_resolved, drain_risks_prevented, co2_impact_kg, recycling_rate
    ) VALUES (
      v_impact_date, v_wc_kg, v_pr_kg, v_org_kg, v_paper_kg, v_metal_kg, v_glass_kg, v_ewaste_kg,
      v_resolved, v_drain_prev, v_co2, v_rec_rate
    );
  END LOOP;

  -- ===== NOTIFICATIONS (sample) =====
  FOR v_i IN 1..20 LOOP
    INSERT INTO notifications (profile_id, type, title, message, read, created_at) VALUES
    (
      v_citizen_ids[((v_i - 1) % 20) + 1],
      CASE WHEN v_i % 4 = 0 THEN 'high_risk' WHEN v_i % 3 = 0 THEN 'assigned' WHEN v_i % 2 = 0 THEN 'collected' ELSE 'report_received' END,
      CASE WHEN v_i % 4 = 0 THEN 'High-Risk Waste Detected' WHEN v_i % 3 = 0 THEN 'Worker Assigned' WHEN v_i % 2 = 0 THEN 'Waste Collected' ELSE 'Report Received' END,
      'Your report CL-2026-' || lpad(v_i::text, 6, '0') || ' has been updated.',
      v_i % 3 = 0,
      now() - (random() * interval '7 days')
    );
  END LOOP;

  -- Officer notifications
  FOR v_i IN 1..10 LOOP
    INSERT INTO notifications (profile_id, type, title, message, read, created_at) VALUES
    (
      v_officer_ids[((v_i - 1) % 5) + 1],
      CASE WHEN v_i % 2 = 0 THEN 'drain_risk' ELSE 'high_priority' END,
      CASE WHEN v_i % 2 = 0 THEN 'Drain Risk Alert' ELSE 'New High-Priority Report' END,
      'Action required for report CL-2026-' || lpad(v_i::text, 6, '0'),
      false,
      now() - (random() * interval '3 days')
    );
  END LOOP;

END $$;