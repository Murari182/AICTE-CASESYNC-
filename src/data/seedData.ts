import {
  AlertRecord,
  BureauCell,
  CaseRecord,
  CaseRelation,
  CaseStatus,
  CoordinationRecord,
  DeadlineState,
  EscalationRecord,
  InstitutionRecord,
  ModelEvaluationMetric,
  Priority,
  RoutingRule,
  SlaConfig,
  TransferRecord,
} from '../types/casesync';

export const INITIAL_SLA_CONFIG: SlaConfig = {
  dueSoonDaysThreshold: 4,
  defaultDisposalDays: 15,
  enableExactPidPriority: true,
  enableCrossBureauAlerts: true,
  similarityReviewThreshold: 68,
};

export const INITIAL_ROUTING_RULES: RoutingRule[] = [
  {
    id: 'rule-rb',
    category: 'Regulatory Norms & Cadre Compliance',
    defaultDepartment: 'Regulation Bureau (RB)',
    defaultPriority: 'Critical',
    slaHours: 72,
    keywords: [
      'regulation',
      'inspection',
      'cadre',
      'faculty ratio',
      'unapproved',
      'norm violation',
      'show cause',
      'deficiency',
      'excess intake',
    ],
    description:
      'Routes statutory norm violations, unapproved intake, and inspection compliance matters to Regulation Bureau (RB).',
  },
  {
    id: 'rule-pgrc',
    category: 'Student & Stakeholder Public Grievance',
    defaultDepartment: 'Public Grievance Redressal Cell (PGRC)',
    defaultPriority: 'High',
    slaHours: 48,
    keywords: [
      'scholarship',
      'fee refund',
      'original certificates',
      'withheld',
      'grievance',
      'harassment',
      'disbursement',
      'pragati',
      'saksham',
    ],
    description:
      'Routes student fee refunds, withheld certificates, and scholarship grievances to PGRC.',
  },
  {
    id: 'rule-ab',
    category: 'Extension of Approval (EoA) & Intake',
    defaultDepartment: 'Approval Bureau (AB)',
    defaultPriority: 'High',
    slaHours: 72,
    keywords: [
      'eoa',
      'extension of approval',
      'intake',
      'affidavit',
      'laboratory',
      'scrutiny',
      'approval letter',
      'accreditation',
    ],
    description:
      'Handles Extension of Approval (EoA), seat intake discrepancies, and compliance affidavits.',
  },
  {
    id: 'rule-fgc',
    category: 'Faculty Service & Salary Grievance',
    defaultDepartment: 'Faculty Grievance Cell (FGC)',
    defaultPriority: 'High',
    slaHours: 48,
    keywords: [
      'salary',
      'arrears',
      'relieving letter',
      'pay scale',
      '7th cpc',
      'faculty resignation',
      'experience certificate',
    ],
    description:
      'Handles faculty pay scale, withheld relieving orders, and service book grievances.',
  },
  {
    id: 'rule-regional',
    category: 'Regional Verification & Inspection',
    defaultDepartment: 'Regional Office (SWRO)',
    defaultPriority: 'Medium',
    slaHours: 96,
    keywords: [
      'regional',
      'site visit',
      'local verification',
      'campus address',
      'noc',
      'university affiliation',
    ],
    description:
      'Coordinates physical verification, regional NOCs, and state-level liaison.',
  },
];

export const INITIAL_INSTITUTIONS: InstitutionRecord[] = [
  {
    institution_id: 'INST-101',
    aicte_permanent_id: '1-482910311',
    name: 'Deccan Institute of Engineering & Technology',
    normalized_name: 'deccan institute of engineering technology hyderabad',
    institution_type: 'Private Self-Financed Engineering Institution',
    address: 'Plot 42, Knowledge Park Corridor, Medchal Road, Hyderabad',
    state: 'Telangana',
    region: 'Southern (SRO)',
    metadata: {
      establishedYear: 2004,
      approvedIntake: 720,
      universityAffiliation: 'Jawaharlal Nehru Technological University, Hyderabad',
      nodalContact: 'registrar@deccaniet.edu.in (Illustrative)',
    },
    verification_status: 'Verified',
  },
  {
    institution_id: 'INST-102',
    aicte_permanent_id: '1-339104821',
    name: 'Government College of Engineering, Pune',
    normalized_name: 'government college of engineering pune',
    institution_type: 'Government Autonomous Technical Institution',
    address: 'Wellesley Road, Shivajinagar, Pune',
    state: 'Maharashtra',
    region: 'Western (WRO)',
    metadata: {
      establishedYear: 1854,
      approvedIntake: 960,
      universityAffiliation: 'Savitribai Phule Pune University',
      nodalContact: 'nodal.aicte@gcoep.ac.in (Illustrative)',
    },
    verification_status: 'Verified',
  },
  {
    institution_id: 'INST-103',
    aicte_permanent_id: '1-774829104',
    name: 'Apex Institute of Technology, Jaipur Rural',
    normalized_name: 'apex institute of technology jaipur',
    institution_type: 'Private Technical Campus',
    address: 'NH-48, Sitapura Institutional Extension, Jaipur',
    state: 'Rajasthan',
    region: 'North-Western (NWRO)',
    metadata: {
      establishedYear: 2011,
      approvedIntake: 480,
      universityAffiliation: 'Rajasthan Technical University, Kota',
      nodalContact: 'compliance@apextechjaipur.org (Illustrative)',
    },
    verification_status: 'Uncertain Identity — Review Required',
    uncertainty_note:
      'Scenario C: Shares normalized name prefix and Sitapura PIN zone with INST-104 (Provisional PID). Human verification required before linking complaints.',
  },
  {
    institution_id: 'INST-104',
    aicte_permanent_id: 'PID-UNVERIFIED-2026-09',
    name: 'Apex Institute of Technology & Management, Jaipur',
    normalized_name: 'apex institute of technology management jaipur',
    institution_type: 'Private Engineering & MBA Institute',
    address: 'Sitapura Industrial & Institutional Area, Phase III, Jaipur',
    state: 'Rajasthan',
    region: 'North-Western (NWRO)',
    metadata: {
      establishedYear: 2012,
      approvedIntake: 360,
      universityAffiliation: 'Rajasthan Technical University, Kota',
      nodalContact: 'director@aitmjaipur.edu.in (Illustrative)',
    },
    verification_status: 'Uncertain Identity — Review Required',
    uncertainty_note:
      'Scenario C: Complaint submitted without verified AICTE Permanent ID. 84% fuzzy name/address similarity with INST-103 (1-774829104). Do not auto-merge.',
  },
  {
    institution_id: 'INST-105',
    aicte_permanent_id: '1-209481723',
    name: 'PSG Institute of Technology & Applied Research',
    normalized_name: 'psg institute of technology applied research coimbatore',
    institution_type: 'Private Aided / Self-Financed Technical Institution',
    address: 'Avinashi Road, Neelambur, Coimbatore',
    state: 'Tamil Nadu',
    region: 'Southern (SRO)',
    metadata: {
      establishedYear: 2014,
      approvedIntake: 540,
      universityAffiliation: 'Anna University, Chennai',
      nodalContact: 'principal@psgitar.ac.in (Illustrative)',
    },
    verification_status: 'Verified',
  },
  {
    institution_id: 'INST-106',
    aicte_permanent_id: '1-558291034',
    name: 'L.D. College of Engineering, Ahmedabad',
    normalized_name: 'ld college of engineering ahmedabad',
    institution_type: 'State Government Engineering Institution',
    address: 'Opp. Gujarat University, Navrangpura, Ahmedabad',
    state: 'Gujarat',
    region: 'Central (CRO)',
    metadata: {
      establishedYear: 1948,
      approvedIntake: 1140,
      universityAffiliation: 'Gujarat Technological University',
      nodalContact: 'aicte.cell@ldce.ac.in (Illustrative)',
    },
    verification_status: 'Verified',
  },
  {
    institution_id: 'INST-107',
    aicte_permanent_id: '1-664920185',
    name: 'Jadavpur Polytechnic & Engineering Campus',
    normalized_name: 'jadavpur polytechnic engineering campus kolkata',
    institution_type: 'Government-Aided Technical Institution',
    address: 'Raja S.C. Mallick Road, Jadavpur, Kolkata',
    state: 'West Bengal',
    region: 'Eastern (ERO)',
    metadata: {
      establishedYear: 1956,
      approvedIntake: 840,
      universityAffiliation: 'MAKAUT, West Bengal',
      nodalContact: 'dean.academic@jpec.edu.in (Illustrative)',
    },
    verification_status: 'Verified',
  },
  {
    institution_id: 'INST-108',
    aicte_permanent_id: '1-883019472',
    name: 'Model Engineering College, Thrikkakara',
    normalized_name: 'model engineering college thrikkakara kochi',
    institution_type: 'Government-Sponsored Engineering Institution',
    address: 'Thrikkakara, Kochi, Ernakulam District',
    state: 'Kerala',
    region: 'South-Western (SWRO)',
    metadata: {
      establishedYear: 1989,
      approvedIntake: 600,
      universityAffiliation: 'APJ Abdul Kalam Technological University',
      nodalContact: 'office@mec.ac.in (Illustrative)',
    },
    verification_status: 'Verified',
  },
  {
    institution_id: 'INST-109',
    aicte_permanent_id: '1-910482736',
    name: 'Walchand Institute of Technology, Solapur',
    normalized_name: 'walchand institute of technology solapur',
    institution_type: 'Autonomous Engineering College',
    address: 'Seth Walchand Hirachand Marg, Ashok Chowk, Solapur',
    state: 'Maharashtra',
    region: 'Western (WRO)',
    metadata: {
      establishedYear: 1983,
      approvedIntake: 660,
      universityAffiliation: 'Punyashlok Ahilyadevi Holkar Solapur University',
      nodalContact: 'registrar@witsolapur.org (Illustrative)',
    },
    verification_status: 'Verified',
  },
  {
    institution_id: 'INST-110',
    aicte_permanent_id: '1-118392045',
    name: 'National Institute of Technical Teachers Training, Bhopal',
    normalized_name: 'national institute of technical teachers training bhopal',
    institution_type: 'Centrally Funded Technical Institute',
    address: 'Shamla Hills, Bhopal',
    state: 'Madhya Pradesh',
    region: 'Central (CRO)',
    metadata: {
      establishedYear: 1965,
      approvedIntake: 420,
      universityAffiliation: 'Autonomous / Ministry of Education',
      nodalContact: 'nodal@nitttrbpl.ac.in (Illustrative)',
    },
    verification_status: 'Verified',
  },
  {
    institution_id: 'INST-111',
    aicte_permanent_id: '1-440291834',
    name: 'Kalinga Institute of Industrial & Technical Studies, Bhubaneswar',
    normalized_name: 'kalinga institute of industrial technical studies bhubaneswar',
    institution_type: 'Private Self-Financed Technical Campus',
    address: 'Chandaka Industrial Estate, Patia, Bhubaneswar',
    state: 'Odisha',
    region: 'Eastern (ERO)',
    metadata: {
      establishedYear: 1997,
      approvedIntake: 1200,
      universityAffiliation: 'Biju Patnaik University of Technology',
      nodalContact: 'compliance@kiits.edu.in (Illustrative)',
    },
    verification_status: 'Verified',
  },
  {
    institution_id: 'INST-112',
    aicte_permanent_id: '1-729104650',
    name: 'Sri Venkateswara College of Engineering, Tirupati',
    normalized_name: 'sri venkateswara college of engineering tirupati',
    institution_type: 'Private Engineering Institution',
    address: 'Karakambadi Road, Renigunta Corridor, Tirupati',
    state: 'Andhra Pradesh',
    region: 'Southern (SRO)',
    metadata: {
      establishedYear: 2007,
      approvedIntake: 600,
      universityAffiliation: 'JNTU Anantapur',
      nodalContact: 'principal@svcetirupati.edu.in (Illustrative)',
    },
    verification_status: 'Verified',
  },
];

export const INITIAL_CASES: CaseRecord[] = [
  // SCENARIO A — Potential Overlap across PGRC & RB at INST-101 (Deccan Institute)
  {
    id: 'CMP-2026-0142',
    institution_id: 'INST-101',
    aicte_permanent_id: '1-482910311',
    institutionName: 'Deccan Institute of Engineering & Technology',
    region: 'Southern (SRO)',
    received_at: '2026-10-18T09:15:00Z',
    title: 'Original degree certificates and 6-month salary arrears withheld for resigning CSE faculty',
    description:
      'Seven assistant professors in the CSE department have had their original M.Tech/Ph.D. certificates and six months of salary arrears withheld by the management despite completing notice periods.',
    submittedBy: 'Prof. Vikramaditya Rao & Faculty Group',
    category: 'Student & Stakeholder Public Grievance',
    predictedCategory: 'Student & Stakeholder Public Grievance',
    confirmedCategory: 'Student & Stakeholder Public Grievance',
    isCategoryOverridden: false,
    current_bureau: 'Public Grievance Redressal Cell (PGRC)',
    recommendedDepartment: 'Public Grievance Redressal Cell (PGRC)',
    assignedDepartment: 'Public Grievance Redressal Cell (PGRC)',
    isDepartmentOverridden: false,
    assigned_officer: 'R. K. Sharma (PGRC Nodal Officer)',
    status: 'Under Process',
    priority: 'Critical',
    last_action_taken: 'Issued directive to institute Principal requesting release of original certificates within 7 days.',
    last_action_at: '2026-10-25T14:20:00Z',
    next_action_required: 'Coordinate with Regulation Bureau (RB) on parallel faculty cadre inspection CMP-2026-0141 before issuing final order.',
    expected_disposal_at: '2026-10-28T18:00:00Z', // Approaching deadline (Due Soon)
    createdAt: '2026-10-18T09:15:00Z',
    updatedAt: '2026-10-25T14:20:00Z',
    linked_case_ids: ['CMP-2026-0141'],
    overlap_status: 'Potential Overlap — Review Required',
    supporting_documents: ['Appointment_Order_CSE.pdf', 'Relieving_Request_Receipts.pdf'],
    confidence: 89,
    classificationSource: 'ai-model',
    explanation: {
      summary: 'Matched exact AICTE Permanent ID 1-482910311 and high semantic overlap (89%) with active RB case CMP-2026-0141 concerning CSE faculty retention and cadre norms.',
      matchedSignals: ['original certificates', 'withheld', 'salary arrears', 'CSE department faculty'],
      routingRuleApplied: 'Layer 1 Exact PID + Layer 3 Simultaneous RB & PGRC Action Alert',
      confidenceNote: 'Operational similarity score indicating overlapping institutional action across PGRC and RB.',
    },
    timeline: [
      {
        action_id: 'ACT-142-1',
        case_id: 'CMP-2026-0142',
        institution_id: 'INST-101',
        actor: 'Central Intake Portal',
        actor_role: 'Submitter',
        bureau: 'Public Grievance Redressal Cell (PGRC)',
        action_type: 'Complaint Received',
        remarks: 'Grievance logged with supporting faculty service records (Illustrative Demo Data).',
        timestamp: '2026-10-18T09:15:00Z',
      },
      {
        action_id: 'ACT-142-2',
        case_id: 'CMP-2026-0142',
        institution_id: 'INST-101',
        actor: 'CaseSync Matching Engine',
        actor_role: 'System Matching Engine',
        bureau: 'Central Registry',
        action_type: 'Related Case Detected',
        remarks: 'Flagged potential overlap with CMP-2026-0141 handled by Regulation Bureau (RB) at same institution (PID: 1-482910311).',
        timestamp: '2026-10-19T11:10:00Z',
        reference_id: 'REL-2026-01',
      },
      {
        action_id: 'ACT-142-3',
        case_id: 'CMP-2026-0142',
        institution_id: 'INST-101',
        actor: 'R. K. Sharma',
        actor_role: 'PGRC Officer',
        bureau: 'Public Grievance Redressal Cell (PGRC)',
        action_type: 'Status Updated',
        previous_value: 'Pending',
        new_value: 'Under Process',
        remarks: 'Called for institute explanation; awaiting joint coordination review with RB.',
        timestamp: '2026-10-25T14:20:00Z',
      },
    ],
  },
  {
    id: 'CMP-2026-0141',
    institution_id: 'INST-101',
    aicte_permanent_id: '1-482910311',
    institutionName: 'Deccan Institute of Engineering & Technology',
    region: 'Southern (SRO)',
    received_at: '2026-10-19T10:30:00Z',
    title: 'Severe faculty cadre shortage and non-payment of 7th CPC scale in CSE & AI programs',
    description:
      'Regulatory complaint reporting that Deccan Institute of Engineering & Technology is operating with a 45% faculty deficit in CSE following mass resignations caused by unpaid salaries and withheld documents.',
    submittedBy: 'SRO Vigilance Referral / Stakeholder Petition',
    category: 'Regulatory Norms & Cadre Compliance',
    predictedCategory: 'Regulatory Norms & Cadre Compliance',
    confirmedCategory: 'Regulatory Norms & Cadre Compliance',
    isCategoryOverridden: false,
    current_bureau: 'Regulation Bureau (RB)',
    recommendedDepartment: 'Regulation Bureau (RB)',
    assignedDepartment: 'Regulation Bureau (RB)',
    isDepartmentOverridden: false,
    assigned_officer: 'Dr. S. Subramanian (RB Under Secretary)',
    status: 'Under Process',
    priority: 'Critical',
    last_action_taken: 'Constituted 3-member Expert Visit Committee (EVC) to verify faculty cadre and payroll compliance.',
    last_action_at: '2026-10-25T16:45:00Z',
    next_action_required: 'Synchronize inspection scope with PGRC Officer handling CMP-2026-0142 to avoid duplicate show-cause notices.',
    expected_disposal_at: '2026-10-29T18:00:00Z',
    createdAt: '2026-10-19T10:30:00Z',
    updatedAt: '2026-10-25T16:45:00Z',
    linked_case_ids: ['CMP-2026-0142'],
    overlap_status: 'Potential Overlap — Review Required',
    supporting_documents: ['SRO_Preliminary_Cadre_Note.pdf', 'Biometric_Attendance_Audit.pdf'],
    confidence: 89,
    classificationSource: 'ai-model',
    explanation: {
      summary: 'Linked via exact AICTE Permanent ID 1-482910311 to CMP-2026-0142. BothRB and PGRC are initiating parallel actions on the same underlying CSE faculty dispute.',
      matchedSignals: ['faculty deficit', 'CSE', 'unpaid salaries', 'withheld documents'],
      routingRuleApplied: 'Layer 3 Cross-Bureau Coordination Rule: Simultaneous RB & PGRC Action',
      confidenceNote: 'Requires human review to coordinate RB regulatory inspection with PGRC grievance redressal.',
    },
    timeline: [
      {
        action_id: 'ACT-141-1',
        case_id: 'CMP-2026-0141',
        institution_id: 'INST-101',
        actor: 'Southern Regional Office',
        actor_role: 'Regional Officer',
        bureau: 'Regulation Bureau (RB)',
        action_type: 'Complaint Received',
        remarks: 'Regulatory norm violation case registered in RB queue.',
        timestamp: '2026-10-19T10:30:00Z',
      },
      {
        action_id: 'ACT-141-2',
        case_id: 'CMP-2026-0141',
        institution_id: 'INST-101',
        actor: 'Dr. S. Subramanian',
        actor_role: 'Regulation Bureau Officer (RB)',
        bureau: 'Regulation Bureau (RB)',
        action_type: 'Status Updated',
        previous_value: 'Pending',
        new_value: 'Under Process',
        remarks: 'Initiated regulatory EVC verification; flagged for cross-bureau coordination with PGRC.',
        timestamp: '2026-10-25T16:45:00Z',
      },
    ],
  },

  // SCENARIO B — Same Institution (INST-102 GCOE Pune), Different Unrelated Issues (Not Auto-Flagged as Duplicates)
  {
    id: 'CMP-2026-0140',
    institution_id: 'INST-102',
    aicte_permanent_id: '1-339104821',
    institutionName: 'Government College of Engineering, Pune',
    region: 'Western (WRO)',
    received_at: '2026-10-16T08:30:00Z',
    title: 'AICTE Pragati Scholarship disbursement pending post-institute verification',
    description:
      'My Pragati scholarship payment for AY 2025–26 has not been credited despite approval by the institute nodal officer and state cell over 45 days ago.',
    submittedBy: 'Ananya Deshmukh (Student ID: PRG-88412)',
    category: 'Student & Stakeholder Public Grievance',
    predictedCategory: 'Student & Stakeholder Public Grievance',
    confirmedCategory: 'Student & Stakeholder Public Grievance',
    isCategoryOverridden: false,
    current_bureau: 'Public Grievance Redressal Cell (PGRC)',
    recommendedDepartment: 'Public Grievance Redressal Cell (PGRC)',
    assignedDepartment: 'Public Grievance Redressal Cell (PGRC)',
    isDepartmentOverridden: false,
    assigned_officer: 'P. V. Kulkarni (PGRC Desk Officer)',
    status: 'Under Process',
    priority: 'High',
    last_action_taken: 'Verified PFMS batch status; awaiting NPCI bank mapper confirmation.',
    last_action_at: '2026-10-24T12:15:00Z',
    next_action_required: 'Confirm DBT credit settlement with Scholarship Finance Cell.',
    expected_disposal_at: '2026-11-02T18:00:00Z',
    createdAt: '2026-10-16T08:30:00Z',
    updatedAt: '2026-10-24T12:15:00Z',
    linked_case_ids: [],
    overlap_status: 'Not Related — Reviewed',
    supporting_documents: ['Pragati_Approval_Receipt.pdf'],
    confidence: 92,
    classificationSource: 'ai-model',
    explanation: {
      summary: 'Scenario B: Shares AICTE Permanent ID 1-339104821 with CMP-2026-0139, but concerns individual student DBT disbursement while CMP-2026-0139 concerns laboratory EoA records.',
      matchedSignals: ['pragati scholarship', 'disbursement', 'pfms'],
      routingRuleApplied: 'Same Institution — Distinct Unrelated Issues (No duplicate alert raised)',
      confidenceNote: 'Low cross-case issue similarity (14%); correctly kept independent.',
    },
    timeline: [
      {
        action_id: 'ACT-140-1',
        case_id: 'CMP-2026-0140',
        institution_id: 'INST-102',
        actor: 'Ananya Deshmukh',
        actor_role: 'Submitter',
        bureau: 'Public Grievance Redressal Cell (PGRC)',
        action_type: 'Complaint Received',
        remarks: 'Student scholarship grievance logged.',
        timestamp: '2026-10-16T08:30:00Z',
      },
    ],
  },
  {
    id: 'CMP-2026-0139',
    institution_id: 'INST-102',
    aicte_permanent_id: '1-339104821',
    institutionName: 'Government College of Engineering, Pune',
    region: 'Western (WRO)',
    received_at: '2026-10-20T11:00:00Z',
    title: 'Correction of CAD/CAM laboratory equipment annexure in EoA portal record',
    description:
      'Request from institute Registrar to update the newly procured CNC and CAD workstation inventory in the Extension of Approval (EoA) compliance annexure.',
    submittedBy: 'Registrar, GCOE Pune',
    category: 'Extension of Approval (EoA) & Intake',
    predictedCategory: 'Extension of Approval (EoA) & Intake',
    confirmedCategory: 'Extension of Approval (EoA) & Intake',
    isCategoryOverridden: false,
    current_bureau: 'Approval Bureau (AB)',
    recommendedDepartment: 'Approval Bureau (AB)',
    assignedDepartment: 'Approval Bureau (AB)',
    isDepartmentOverridden: false,
    assigned_officer: 'M. S. Narayanan (AB Section Officer)',
    status: 'Disposed',
    priority: 'Medium',
    last_action_taken: 'Annexure verified against stock register and updated in AB portal.',
    last_action_at: '2026-10-25T17:00:00Z',
    next_action_required: 'Disposed — No further action required.',
    expected_disposal_at: '2026-10-30T18:00:00Z',
    createdAt: '2026-10-20T11:00:00Z',
    updatedAt: '2026-10-25T17:00:00Z',
    linked_case_ids: [],
    overlap_status: 'Not Related — Reviewed',
    supporting_documents: ['Lab_Stock_Verification_2026.pdf'],
    confidence: 91,
    classificationSource: 'ai-model',
    explanation: {
      summary: 'Scenario B: Consolidated under GCOE Pune profile alongside CMP-2026-0140, but involves unrelated Approval Bureau laboratory inventory.',
      matchedSignals: ['extension of approval', 'eoa', 'laboratory equipment'],
      routingRuleApplied: 'Approval Bureau (AB) Standard Workflow',
      confidenceNote: 'Verified distinct from PGRC scholarship matters.',
    },
    timeline: [
      {
        action_id: 'ACT-139-1',
        case_id: 'CMP-2026-0139',
        institution_id: 'INST-102',
        actor: 'M. S. Narayanan',
        actor_role: 'Administrator',
        bureau: 'Approval Bureau (AB)',
        action_type: 'Case Disposed',
        previous_value: 'Under Process',
        new_value: 'Disposed',
        remarks: 'Updated laboratory compliance annexure and closed ticket.',
        timestamp: '2026-10-25T17:00:00Z',
      },
    ],
  },

  // SCENARIO C — Uncertain Institution Identity (INST-103 vs INST-104 in Jaipur)
  {
    id: 'CMP-2026-0138',
    institution_id: 'INST-103',
    aicte_permanent_id: '1-774829104',
    institutionName: 'Apex Institute of Technology, Jaipur Rural',
    region: 'North-Western (NWRO)',
    received_at: '2026-10-12T09:40:00Z',
    title: 'Collection of unapproved capitation / development fee from B.Tech 1st year batch',
    description:
      'Students admitted to B.Tech Computer Science at Apex Institute of Technology in Sitapura, Jaipur were compelled to pay Rs. 45,000 in cash towards unapproved building development charges.',
    submittedBy: 'Parent & Student Representation (Jaipur)',
    category: 'Regulatory Norms & Cadre Compliance',
    predictedCategory: 'Regulatory Norms & Cadre Compliance',
    confirmedCategory: 'Regulatory Norms & Cadre Compliance',
    isCategoryOverridden: false,
    current_bureau: 'Regulation Bureau (RB)',
    recommendedDepartment: 'Regulation Bureau (RB)',
    assignedDepartment: 'Regulation Bureau (RB)',
    isDepartmentOverridden: false,
    assigned_officer: 'Dr. S. Subramanian (RB Under Secretary)',
    status: 'Pending',
    priority: 'High',
    last_action_taken: 'Flagged for institution identity resolution with NWRO Regional Office.',
    last_action_at: '2026-10-22T11:20:00Z',
    next_action_required: 'Verify whether CMP-2026-0137 (submitted without Permanent ID for "Apex Institute of Technology & Management") refers to the same campus.',
    expected_disposal_at: '2026-10-24T18:00:00Z', // Overdue!
    createdAt: '2026-10-12T09:40:00Z',
    updatedAt: '2026-10-22T11:20:00Z',
    linked_case_ids: ['CMP-2026-0137'],
    overlap_status: 'Institution Identity Uncertain',
    supporting_documents: ['Fee_Receipt_Scan_Jaipur.pdf'],
    confidence: 84,
    classificationSource: 'deterministic-rules',
    explanation: {
      summary: 'Scenario C: High fuzzy name/address similarity (84%) with CMP-2026-0137, where Permanent ID was omitted. System halted auto-merge and queued human identity verification.',
      matchedSignals: ['apex institute of technology', 'sitapura jaipur', 'unapproved fee'],
      routingRuleApplied: 'Layer 1 Fuzzy Identity Guardrail — Require Human Verification',
      confidenceNote: 'Identity similarity score is 84%, but conflicting trust names exist in Sitapura zone.',
    },
    timeline: [
      {
        action_id: 'ACT-138-1',
        case_id: 'CMP-2026-0138',
        institution_id: 'INST-103',
        actor: 'CaseSync Matching Engine',
        actor_role: 'System Matching Engine',
        bureau: 'Central Registry',
        action_type: 'Related Case Detected',
        remarks: 'Uncertain Institution Identity flagged between INST-103 (1-774829104) and INST-104 (PID-UNVERIFIED-2026-09).',
        timestamp: '2026-10-22T11:20:00Z',
        reference_id: 'REL-2026-03',
      },
    ],
  },
  {
    id: 'CMP-2026-0137',
    institution_id: 'INST-104',
    aicte_permanent_id: 'PID-UNVERIFIED-2026-09',
    institutionName: 'Apex Institute of Technology & Management, Jaipur',
    region: 'North-Western (NWRO)',
    received_at: '2026-10-14T15:10:00Z',
    title: 'Non-refund of tuition fee after admission cancellation within AICTE deadline',
    description:
      'Applied for admission cancellation before the last date notified in the academic calendar at Apex Institute in Sitapura Jaipur, but the accounts office refused to refund tuition and development fees.',
    submittedBy: 'Harshvardhan Shekhawat',
    category: 'Student & Stakeholder Public Grievance',
    predictedCategory: 'Student & Stakeholder Public Grievance',
    confirmedCategory: 'Student & Stakeholder Public Grievance',
    isCategoryOverridden: false,
    current_bureau: 'Public Grievance Redressal Cell (PGRC)',
    recommendedDepartment: 'Public Grievance Redressal Cell (PGRC)',
    assignedDepartment: 'Public Grievance Redressal Cell (PGRC)',
    isDepartmentOverridden: false,
    assigned_officer: 'R. K. Sharma (PGRC Nodal Officer)',
    status: 'Pending',
    priority: 'High',
    last_action_taken: 'Requested NWRO Regional Officer to confirm exact AICTE Permanent ID of respondent institution.',
    last_action_at: '2026-10-23T10:00:00Z',
    next_action_required: 'Complete Layer 1 Institution Identity Verification in Overlap Detection.',
    expected_disposal_at: '2026-10-25T18:00:00Z', // Overdue!
    createdAt: '2026-10-14T15:10:00Z',
    updatedAt: '2026-10-23T10:00:00Z',
    linked_case_ids: ['CMP-2026-0138'],
    overlap_status: 'Institution Identity Uncertain',
    supporting_documents: ['Cancellation_Application_Copy.pdf'],
    confidence: 84,
    classificationSource: 'deterministic-rules',
    explanation: {
      summary: 'Scenario C: Submitted without Permanent ID. Fuzzy entity resolution matched "Apex Institute... Sitapura Jaipur" against INST-103 (84% similarity).',
      matchedSignals: ['fee refund', 'admission cancellation', 'sitapura jaipur'],
      routingRuleApplied: 'Layer 1 Identity Verification Hold',
      confidenceNote: 'Awaiting officer confirmation of whether INST-103 and INST-104 are the same legal entity.',
    },
    timeline: [
      {
        action_id: 'ACT-137-1',
        case_id: 'CMP-2026-0137',
        institution_id: 'INST-104',
        actor: 'Harshvardhan Shekhawat',
        actor_role: 'Submitter',
        bureau: 'Public Grievance Redressal Cell (PGRC)',
        action_type: 'Complaint Received',
        remarks: 'Submitted without AICTE Permanent ID; provisional record created.',
        timestamp: '2026-10-14T15:10:00Z',
      },
    ],
  },

  // CONFIRMED RELATED CASES & TRANSFER WORKFLOW — INST-105 (PSG Institute of Technology)
  {
    id: 'CMP-2026-0136',
    institution_id: 'INST-105',
    aicte_permanent_id: '1-209481723',
    institutionName: 'PSG Institute of Technology & Applied Research',
    region: 'Southern (SRO)',
    received_at: '2026-10-15T11:30:00Z',
    title: 'Extension of Approval (EoA) seat intake discrepancy for B.Tech AI & Data Science',
    description:
      'Institute EoA letter for AY 2026–27 reflects 60 seats instead of 120 seats recommended by the Regional Scrutiny Committee following laboratory compliance verification.',
    submittedBy: 'Dr. S. Venkataraman (Registrar)',
    category: 'Extension of Approval (EoA) & Intake',
    predictedCategory: 'Extension of Approval (EoA) & Intake',
    confirmedCategory: 'Extension of Approval (EoA) & Intake',
    isCategoryOverridden: false,
    current_bureau: 'Approval Bureau (AB)',
    recommendedDepartment: 'Approval Bureau (AB)',
    assignedDepartment: 'Approval Bureau (AB)',
    isDepartmentOverridden: false,
    assigned_officer: 'M. S. Narayanan (AB Section Officer)',
    status: 'Under Process',
    priority: 'High',
    last_action_taken: 'Confirmed relationship with SRO inspection file CMP-2026-0135; joint review underway.',
    last_action_at: '2026-10-25T09:30:00Z',
    next_action_required: 'Issue corrigendum EoA after receiving SRO signed inspection sheet from CMP-2026-0135.',
    expected_disposal_at: '2026-10-29T18:00:00Z',
    createdAt: '2026-10-15T11:30:00Z',
    updatedAt: '2026-10-25T09:30:00Z',
    linked_case_ids: ['CMP-2026-0135'],
    overlap_status: 'Confirmed Related Cases',
    supporting_documents: ['EoA_2026_27_Copy.pdf', 'Scrutiny_Committee_Minutes.pdf'],
    confidence: 95,
    classificationSource: 'ai-model',
    explanation: {
      summary: 'Human reviewer confirmed relationship between AB seat intake petition (CMP-2026-0136) and SRO regional verification report (CMP-2026-0135).',
      matchedSignals: ['eoa', 'intake discrepancy', '120 seats', 'scrutiny committee'],
      routingRuleApplied: 'Confirmed Cross-Bureau Coordination (AB + SRO)',
      confidenceNote: 'Confirmed related cases retaining independent case IDs.',
    },
    timeline: [
      {
        action_id: 'ACT-136-1',
        case_id: 'CMP-2026-0136',
        institution_id: 'INST-105',
        actor: 'Meera Nair',
        actor_role: 'Administrator',
        bureau: 'Approval Bureau (AB)',
        action_type: 'Overlap Reviewed',
        previous_value: 'Potential Overlap — Review Required',
        new_value: 'Confirmed Related Cases',
        remarks: 'Confirmed related to CMP-2026-0135 without merging individual case identities.',
        timestamp: '2026-10-25T09:30:00Z',
        reference_id: 'REL-2026-02',
      },
    ],
  },
  {
    id: 'CMP-2026-0135',
    institution_id: 'INST-105',
    aicte_permanent_id: '1-209481723',
    institutionName: 'PSG Institute of Technology & Applied Research',
    region: 'Southern (SRO)',
    received_at: '2026-10-17T14:00:00Z',
    title: 'Regional Scrutiny Committee physical verification report for AI & DS intake expansion',
    description:
      'Regional Office (SRO) verification file transmitted to Approval Bureau regarding compliance of computing laboratories for 120 intake seats.',
    submittedBy: 'Southern Regional Office (SRO)',
    category: 'Regional Verification & Inspection',
    predictedCategory: 'Regional Verification & Inspection',
    confirmedCategory: 'Regional Verification & Inspection',
    isCategoryOverridden: false,
    current_bureau: 'Regional Office (SRO)',
    recommendedDepartment: 'Regional Office (SRO)',
    assignedDepartment: 'Regional Office (SRO)',
    isDepartmentOverridden: false,
    assigned_officer: 'K. Balasubramanian (SRO Regional Officer)',
    status: 'Transferred',
    priority: 'High',
    last_action_taken: 'Transfer requested from Regional Office (SRO) to Approval Bureau (AB) with signed verification annexure.',
    last_action_at: '2026-10-25T11:15:00Z',
    next_action_required: 'Approval Bureau (AB) officer to accept transfer handoff TRF-2026-01.',
    expected_disposal_at: '2026-10-30T18:00:00Z',
    createdAt: '2026-10-17T14:00:00Z',
    updatedAt: '2026-10-25T11:15:00Z',
    linked_case_ids: ['CMP-2026-0136'],
    overlap_status: 'Confirmed Related Cases',
    supporting_documents: ['SRO_Physical_Verification_Signed.pdf'],
    confidence: 95,
    classificationSource: 'ai-model',
    explanation: {
      summary: 'Linked companion case to CMP-2026-0136; currently in Transferred state awaiting AB handoff acceptance.',
      matchedSignals: ['regional scrutiny', '120 intake seats', 'approval bureau'],
      routingRuleApplied: 'Inter-Bureau Transfer Workflow (SRO → AB)',
      confidenceNote: 'Confirmed related record.',
    },
    timeline: [
      {
        action_id: 'ACT-135-1',
        case_id: 'CMP-2026-0135',
        institution_id: 'INST-105',
        actor: 'K. Balasubramanian',
        actor_role: 'Regional Officer',
        bureau: 'Regional Office (SRO)',
        action_type: 'Case Transferred',
        previous_value: 'Under Process',
        new_value: 'Transferred',
        remarks: 'Initiated formal transfer TRF-2026-01 to Approval Bureau (AB).',
        timestamp: '2026-10-25T11:15:00Z',
        reference_id: 'TRF-2026-01',
      },
    ],
  },

  // Additional cases across institutions, bureaus, statuses, and deadlines
  {
    id: 'CMP-2026-0134',
    institution_id: 'INST-106',
    aicte_permanent_id: '1-558291034',
    institutionName: 'L.D. College of Engineering, Ahmedabad',
    region: 'Central (CRO)',
    received_at: '2026-10-10T10:12:00Z',
    title: 'Delayed CAS promotion and 7th CPC arrears for senior Mechanical Engineering faculty',
    description:
      'Career Advancement Scheme (CAS) stage-3 promotion orders and associated pay fixation arrears have remained pending for 14 months despite AICTE notification compliance.',
    submittedBy: 'Dr. H. M. Patel & 4 Faculty Members',
    category: 'Faculty Service & Salary Grievance',
    predictedCategory: 'Faculty Service & Salary Grievance',
    confirmedCategory: 'Faculty Service & Salary Grievance',
    isCategoryOverridden: false,
    current_bureau: 'Faculty Grievance Cell (FGC)',
    recommendedDepartment: 'Faculty Grievance Cell (FGC)',
    assignedDepartment: 'Faculty Grievance Cell (FGC)',
    isDepartmentOverridden: false,
    assigned_officer: 'Smt. Vandana Joshi (FGC Officer)',
    status: 'Escalated',
    priority: 'Critical',
    last_action_taken: 'Escalated to Competent Authority after second reminder to State Technical Education Department.',
    last_action_at: '2026-10-24T17:30:00Z',
    next_action_required: 'Senior Management review of show-cause recommendation ESC-2026-01.',
    expected_disposal_at: '2026-10-23T18:00:00Z', // Overdue!
    createdAt: '2026-10-10T10:12:00Z',
    updatedAt: '2026-10-24T17:30:00Z',
    linked_case_ids: [],
    overlap_status: 'No Overlap',
    supporting_documents: ['CAS_Screening_Record.pdf'],
    confidence: 93,
    classificationSource: 'ai-model',
    explanation: {
      summary: 'Single-bureau faculty service grievance escalated due to overdue state response.',
      matchedSignals: ['7th cpc', 'arrears', 'faculty', 'promotion'],
      routingRuleApplied: 'Faculty Grievance Cell (FGC) Standard Rule',
      confidenceNote: 'No overlapping cross-bureau case detected for INST-106.',
    },
    timeline: [
      {
        action_id: 'ACT-134-1',
        case_id: 'CMP-2026-0134',
        institution_id: 'INST-106',
        actor: 'Smt. Vandana Joshi',
        actor_role: 'Administrator',
        bureau: 'Faculty Grievance Cell (FGC)',
        action_type: 'Case Escalated',
        previous_value: 'Under Process',
        new_value: 'Escalated',
        remarks: 'Escalated to Level 2 Competent Authority due to elapsed response deadline.',
        timestamp: '2026-10-24T17:30:00Z',
        reference_id: 'ESC-2026-01',
      },
    ],
  },
  {
    id: 'CMP-2026-0133',
    institution_id: 'INST-107',
    aicte_permanent_id: '1-664920185',
    institutionName: 'Jadavpur Polytechnic & Engineering Campus',
    region: 'Eastern (ERO)',
    received_at: '2026-10-21T14:40:00Z',
    title: 'Academic Bank of Credits (ABC ID) mapping mismatch for diploma-to-degree lateral entry batch',
    description:
      'Lateral entry students admitted in Semester 3 are showing unmapped ABC IDs in the central registry, blocking scholarship renewal verification.',
    submittedBy: 'Academic Dean Office, Kolkata',
    category: 'Student & Stakeholder Public Grievance',
    predictedCategory: 'Student & Stakeholder Public Grievance',
    confirmedCategory: 'Student & Stakeholder Public Grievance',
    isCategoryOverridden: false,
    current_bureau: 'Public Grievance Redressal Cell (PGRC)',
    recommendedDepartment: 'Public Grievance Redressal Cell (PGRC)',
    assignedDepartment: 'Public Grievance Redressal Cell (PGRC)',
    isDepartmentOverridden: false,
    assigned_officer: 'R. K. Sharma (PGRC Nodal Officer)',
    status: 'Under Process',
    priority: 'Medium',
    last_action_taken: 'Batch CSV schema validated with ERO Kolkata technical desk.',
    last_action_at: '2026-10-25T10:00:00Z',
    next_action_required: 'Verify synchronized student enrollment IDs.',
    expected_disposal_at: '2026-11-05T18:00:00Z',
    createdAt: '2026-10-21T14:40:00Z',
    updatedAt: '2026-10-25T10:00:00Z',
    linked_case_ids: [],
    overlap_status: 'No Overlap',
    supporting_documents: ['Lateral_Entry_Batch_Manifest.csv'],
    confidence: 88,
    classificationSource: 'ai-model',
    explanation: {
      summary: 'Standard student registry grievance assigned to PGRC.',
      matchedSignals: ['abc id', 'lateral entry', 'scholarship renewal'],
      routingRuleApplied: 'Public Grievance Redressal Cell (PGRC)',
      confidenceNote: 'No cross-bureau conflict.',
    },
    timeline: [
      {
        action_id: 'ACT-133-1',
        case_id: 'CMP-2026-0133',
        institution_id: 'INST-107',
        actor: 'Academic Dean Office',
        actor_role: 'Submitter',
        bureau: 'Public Grievance Redressal Cell (PGRC)',
        action_type: 'Complaint Received',
        remarks: 'Case registered in PGRC queue.',
        timestamp: '2026-10-21T14:40:00Z',
      },
    ],
  },
  {
    id: 'CMP-2026-0132',
    institution_id: 'INST-108',
    aicte_permanent_id: '1-883019472',
    institutionName: 'Model Engineering College, Thrikkakara',
    region: 'South-Western (SWRO)',
    received_at: '2026-10-19T13:20:00Z',
    title: 'Verification of barrier-free built environment and ramp compliance for EoA 2026–27',
    description:
      'Submission of PWD accessibility compliance photographs and structural audit certificate following SWRO regional observation.',
    submittedBy: 'Principal, Model Engineering College',
    category: 'Regional Verification & Inspection',
    predictedCategory: 'Regional Verification & Inspection',
    confirmedCategory: 'Regional Verification & Inspection',
    isCategoryOverridden: false,
    current_bureau: 'Regional Office (SWRO)',
    recommendedDepartment: 'Regional Office (SWRO)',
    assignedDepartment: 'Regional Office (SWRO)',
    isDepartmentOverridden: false,
    assigned_officer: 'N. Jayakumar (SWRO Officer)',
    status: 'Disposed',
    priority: 'Low',
    last_action_taken: 'Accessibility audit verified and marked compliant.',
    last_action_at: '2026-10-23T15:40:00Z',
    next_action_required: 'Disposed — Compliance recorded.',
    expected_disposal_at: '2026-11-01T18:00:00Z',
    createdAt: '2026-10-19T13:20:00Z',
    updatedAt: '2026-10-23T15:40:00Z',
    linked_case_ids: [],
    overlap_status: 'No Overlap',
    supporting_documents: ['Structural_Accessibility_Certificate.pdf'],
    confidence: 90,
    classificationSource: 'ai-model',
    explanation: {
      summary: 'Regional compliance verification completed by SWRO.',
      matchedSignals: ['regional', 'verification', 'eoa'],
      routingRuleApplied: 'Regional Office (SWRO)',
      confidenceNote: 'Disposed on schedule.',
    },
    timeline: [
      {
        action_id: 'ACT-132-1',
        case_id: 'CMP-2026-0132',
        institution_id: 'INST-108',
        actor: 'N. Jayakumar',
        actor_role: 'Regional Officer',
        bureau: 'Regional Office (SWRO)',
        action_type: 'Case Disposed',
        previous_value: 'Under Process',
        new_value: 'Disposed',
        remarks: 'Verified barrier-free compliance report.',
        timestamp: '2026-10-23T15:40:00Z',
      },
    ],
  },
  {
    id: 'CMP-2026-0131',
    institution_id: 'INST-109',
    aicte_permanent_id: '1-910482736',
    institutionName: 'Walchand Institute of Technology, Solapur',
    region: 'Western (WRO)',
    received_at: '2026-10-15T08:50:00Z',
    title: 'Saksham Scholarship disability certificate re-upload window request',
    description:
      'Saksham scholarship application was marked defective due to a blurred scan; student requests portal re-upload activation.',
    submittedBy: 'Rohan Kulkarni',
    category: 'Student & Stakeholder Public Grievance',
    predictedCategory: 'Student & Stakeholder Public Grievance',
    confirmedCategory: 'Student & Stakeholder Public Grievance',
    isCategoryOverridden: false,
    current_bureau: 'Public Grievance Redressal Cell (PGRC)',
    recommendedDepartment: 'Public Grievance Redressal Cell (PGRC)',
    assignedDepartment: 'Public Grievance Redressal Cell (PGRC)',
    isDepartmentOverridden: false,
    assigned_officer: 'P. V. Kulkarni (PGRC Desk Officer)',
    status: 'Disposed',
    priority: 'Medium',
    last_action_taken: 'Re-enabled document edit window; fresh certificate verified.',
    last_action_at: '2026-10-21T11:25:00Z',
    next_action_required: 'Disposed — Document verified.',
    expected_disposal_at: '2026-10-28T18:00:00Z',
    createdAt: '2026-10-15T08:50:00Z',
    updatedAt: '2026-10-21T11:25:00Z',
    linked_case_ids: [],
    overlap_status: 'No Overlap',
    supporting_documents: ['Saksham_Defect_Notice.pdf'],
    confidence: 92,
    classificationSource: 'ai-model',
    explanation: {
      summary: 'Resolved student scholarship portal support case.',
      matchedSignals: ['saksham', 'scholarship', 'certificate'],
      routingRuleApplied: 'Public Grievance Redressal Cell (PGRC)',
      confidenceNote: 'Disposed.',
    },
    timeline: [
      {
        action_id: 'ACT-131-1',
        case_id: 'CMP-2026-0131',
        institution_id: 'INST-109',
        actor: 'P. V. Kulkarni',
        actor_role: 'PGRC Officer',
        bureau: 'Public Grievance Redressal Cell (PGRC)',
        action_type: 'Case Disposed',
        previous_value: 'Under Process',
        new_value: 'Disposed',
        remarks: 'Student re-uploaded valid disability certificate.',
        timestamp: '2026-10-21T11:25:00Z',
      },
    ],
  },
  {
    id: 'CMP-2026-0130',
    institution_id: 'INST-111',
    aicte_permanent_id: '1-440291834',
    institutionName: 'Kalinga Institute of Industrial & Technical Studies, Bhubaneswar',
    region: 'Eastern (ERO)',
    received_at: '2026-10-20T09:00:00Z',
    title: 'Alleged excess admission beyond approved EoA intake in MCA program (RB Inquiry)',
    description:
      'Complaint alleging that the institution admitted 38 supernumerary students above the AICTE approved intake of 120 in the MCA program without prior approval.',
    submittedBy: 'Eastern Regional Vigilance Cell',
    category: 'Regulatory Norms & Cadre Compliance',
    predictedCategory: 'Regulatory Norms & Cadre Compliance',
    confirmedCategory: 'Regulatory Norms & Cadre Compliance',
    isCategoryOverridden: false,
    current_bureau: 'Regulation Bureau (RB)',
    recommendedDepartment: 'Regulation Bureau (RB)',
    assignedDepartment: 'Regulation Bureau (RB)',
    isDepartmentOverridden: false,
    assigned_officer: 'Dr. S. Subramanian (RB Under Secretary)',
    status: 'Under Process',
    priority: 'Critical',
    last_action_taken: 'Requested university enrollment ledger from BPUT and Approval Bureau intake file.',
    last_action_at: '2026-10-25T15:10:00Z',
    next_action_required: 'Cross-verify MCA admission roster with CMP-2026-0129 (student enrollment grievance at same institute).',
    expected_disposal_at: '2026-10-28T18:00:00Z', // Approaching deadline!
    createdAt: '2026-10-20T09:00:00Z',
    updatedAt: '2026-10-25T15:10:00Z',
    linked_case_ids: ['CMP-2026-0129'],
    overlap_status: 'Potential Overlap — Review Required',
    supporting_documents: ['MCA_Admission_Ledger_Query.pdf'],
    confidence: 87,
    classificationSource: 'ai-model',
    explanation: {
      summary: 'Matched exact PID 1-440291834 with PGRC complaint CMP-2026-0129 where MCA students reported unissued university registration numbers.',
      matchedSignals: ['excess intake', 'mca program', 'unapproved'],
      routingRuleApplied: 'Layer 3 Cross-Bureau Overlap Alert (RB + PGRC)',
      confidenceNote: 'Both RB and PGRC are investigating the same MCA batch.',
    },
    timeline: [
      {
        action_id: 'ACT-130-1',
        case_id: 'CMP-2026-0130',
        institution_id: 'INST-111',
        actor: 'Dr. S. Subramanian',
        actor_role: 'Regulation Bureau Officer (RB)',
        bureau: 'Regulation Bureau (RB)',
        action_type: 'Complaint Received',
        remarks: 'Regulatory inquiry opened on MCA intake compliance.',
        timestamp: '2026-10-20T09:00:00Z',
      },
    ],
  },
  {
    id: 'CMP-2026-0129',
    institution_id: 'INST-111',
    aicte_permanent_id: '1-440291834',
    institutionName: 'Kalinga Institute of Industrial & Technical Studies, Bhubaneswar',
    region: 'Eastern (ERO)',
    received_at: '2026-10-22T12:30:00Z',
    title: 'University examination roll numbers not generated for 38 first-year MCA students',
    description:
      'Thirty-eight MCA 1st semester students have not received university registration numbers two weeks before semester examinations.',
    submittedBy: 'MCA Student Representatives (Bhubaneswar)',
    category: 'Student & Stakeholder Public Grievance',
    predictedCategory: 'Student & Stakeholder Public Grievance',
    confirmedCategory: 'Student & Stakeholder Public Grievance',
    isCategoryOverridden: false,
    current_bureau: 'Public Grievance Redressal Cell (PGRC)',
    recommendedDepartment: 'Public Grievance Redressal Cell (PGRC)',
    assignedDepartment: 'Public Grievance Redressal Cell (PGRC)',
    isDepartmentOverridden: false,
    assigned_officer: 'R. K. Sharma (PGRC Nodal Officer)',
    status: 'Pending',
    priority: 'Critical',
    last_action_taken: 'Matched with RB inquiry CMP-2026-0130 concerning alleged excess MCA admissions.',
    last_action_at: '2026-10-25T15:30:00Z',
    next_action_required: 'Hold separate PGRC directive and coordinate joint action with Regulation Bureau (RB).',
    expected_disposal_at: '2026-10-27T18:00:00Z', // Approaching deadline!
    createdAt: '2026-10-22T12:30:00Z',
    updatedAt: '2026-10-25T15:30:00Z',
    linked_case_ids: ['CMP-2026-0130'],
    overlap_status: 'Potential Overlap — Review Required',
    supporting_documents: ['MCA_Student_Admission_Receipts.pdf'],
    confidence: 87,
    classificationSource: 'ai-model',
    explanation: {
      summary: 'Directly linked to RB case CMP-2026-0130 (both reference 38 MCA students at PID 1-440291834).',
      matchedSignals: ['38', 'mca', 'registration numbers'],
      routingRuleApplied: 'Layer 3 Cross-Bureau Overlap Alert (RB + PGRC)',
      confidenceNote: 'High urgency coordination required.',
    },
    timeline: [
      {
        action_id: 'ACT-129-1',
        case_id: 'CMP-2026-0129',
        institution_id: 'INST-111',
        actor: 'CaseSync Matching Engine',
        actor_role: 'System Matching Engine',
        bureau: 'Central Registry',
        action_type: 'Related Case Detected',
        remarks: 'Detected overlap with RB excess-intake inquiry CMP-2026-0130.',
        timestamp: '2026-10-25T15:30:00Z',
        reference_id: 'REL-2026-04',
      },
    ],
  },
  {
    id: 'CMP-2026-0128',
    institution_id: 'INST-112',
    aicte_permanent_id: '1-729104650',
    institutionName: 'Sri Venkateswara College of Engineering, Tirupati',
    region: 'Southern (SRO)',
    received_at: '2026-10-23T16:10:00Z',
    title: 'Request for NOC verification for closure of under-enrolled Diploma shift',
    description:
      'Application for progressive closure of 2nd shift Diploma in Civil Engineering awaiting University and State DTE NOC verification.',
    submittedBy: 'Secretary, Sri Venkateswara Educational Society',
    category: 'Extension of Approval (EoA) & Intake',
    predictedCategory: 'Extension of Approval (EoA) & Intake',
    confirmedCategory: 'Extension of Approval (EoA) & Intake',
    isCategoryOverridden: false,
    current_bureau: 'Approval Bureau (AB)',
    recommendedDepartment: 'Approval Bureau (AB)',
    assignedDepartment: 'Approval Bureau (AB)',
    isDepartmentOverridden: false,
    assigned_officer: 'M. S. Narayanan (AB Section Officer)',
    status: 'Received',
    priority: 'Low',
    last_action_taken: 'Application logged and queued for initial scrutiny.',
    last_action_at: '2026-10-23T16:10:00Z',
    next_action_required: 'Assign to SRO scrutiny desk for DTE NOC check.',
    expected_disposal_at: '2026-11-08T18:00:00Z',
    createdAt: '2026-10-23T16:10:00Z',
    updatedAt: '2026-10-23T16:10:00Z',
    linked_case_ids: [],
    overlap_status: 'No Overlap',
    supporting_documents: ['DTE_Closure_Application.pdf'],
    confidence: 89,
    classificationSource: 'ai-model',
    explanation: {
      summary: 'Routine Approval Bureau progressive closure application.',
      matchedSignals: ['noc', 'closure', 'intake'],
      routingRuleApplied: 'Approval Bureau (AB)',
      confidenceNote: 'No overlap.',
    },
    timeline: [
      {
        action_id: 'ACT-128-1',
        case_id: 'CMP-2026-0128',
        institution_id: 'INST-112',
        actor: 'Central Intake Portal',
        actor_role: 'Submitter',
        bureau: 'Approval Bureau (AB)',
        action_type: 'Complaint Received',
        remarks: 'Received closure NOC verification request.',
        timestamp: '2026-10-23T16:10:00Z',
      },
    ],
  },
  {
    id: 'CMP-2026-0127',
    institution_id: 'INST-110',
    aicte_permanent_id: '1-118392045',
    institutionName: 'National Institute of Technical Teachers Training, Bhopal',
    region: 'Central (CRO)',
    received_at: '2026-10-24T11:00:00Z',
    title: 'FDP participation certificate synchronization delay on ATAL Academy portal',
    description:
      'Forty-two faculty participants who completed the 6-day ATAL FDP on Cyber Physical Systems have not received synchronized digital certificates.',
    submittedBy: 'FDP Coordinator, Bhopal',
    category: 'Student & Stakeholder Public Grievance',
    predictedCategory: 'Student & Stakeholder Public Grievance',
    confirmedCategory: 'Student & Stakeholder Public Grievance',
    isCategoryOverridden: false,
    current_bureau: 'Public Grievance Redressal Cell (PGRC)',
    recommendedDepartment: 'Public Grievance Redressal Cell (PGRC)',
    assignedDepartment: 'Public Grievance Redressal Cell (PGRC)',
    isDepartmentOverridden: false,
    assigned_officer: 'P. V. Kulkarni (PGRC Desk Officer)',
    status: 'Pending',
    priority: 'Low',
    last_action_taken: 'Forwarded attendance batch ID to portal technical support.',
    last_action_at: '2026-10-25T09:15:00Z',
    next_action_required: 'Confirm batch certificate generation.',
    expected_disposal_at: '2026-11-06T18:00:00Z',
    createdAt: '2026-10-24T11:00:00Z',
    updatedAt: '2026-10-25T09:15:00Z',
    linked_case_ids: [],
    overlap_status: 'No Overlap',
    supporting_documents: ['ATAL_FDP_Attendance_Sheet.pdf'],
    confidence: 86,
    classificationSource: 'ai-model',
    explanation: {
      summary: 'Standard FDP certificate query assigned to PGRC.',
      matchedSignals: ['fdp', 'certificate', 'portal'],
      routingRuleApplied: 'Public Grievance Redressal Cell (PGRC)',
      confidenceNote: 'No overlap.',
    },
    timeline: [
      {
        action_id: 'ACT-127-1',
        case_id: 'CMP-2026-0127',
        institution_id: 'INST-110',
        actor: 'FDP Coordinator',
        actor_role: 'Submitter',
        bureau: 'Public Grievance Redressal Cell (PGRC)',
        action_type: 'Complaint Received',
        remarks: 'Logged FDP certificate synchronization ticket.',
        timestamp: '2026-10-24T11:00:00Z',
      },
    ],
  },
];

export const INITIAL_RELATIONS: CaseRelation[] = [
  {
    relation_id: 'REL-2026-01',
    institution_id: 'INST-101',
    institution_name: 'Deccan Institute of Engineering & Technology',
    aicte_permanent_id: '1-482910311',
    case_id_a: 'CMP-2026-0142',
    case_id_b: 'CMP-2026-0141',
    bureau_a: 'Public Grievance Redressal Cell (PGRC)',
    bureau_b: 'Regulation Bureau (RB)',
    relation_type: 'Simultaneous RB & PGRC Action',
    match_method: 'Layer 1 Exact Permanent ID + Layer 2 Semantic Issue Match',
    match_score: 89,
    review_status: 'Potential Overlap — Review Required',
    remarks:
      'Scenario A: Both PGRC and RB have active proceedings concerning CSE faculty resignations, withheld original certificates, and resulting faculty cadre deficit at PID 1-482910311.',
    matching_signals: [
      'Exact AICTE Permanent ID: 1-482910311',
      'Shared Department Context: B.Tech CSE Faculty',
      'Overlapping Root Cause: Unpaid 6-month salary & withheld certificates causing 45% cadre deficit',
      'Active Parallel Actions: PGRC directive + RB Expert Visit Committee (EVC)',
    ],
    why_raised:
      'Regulation Bureau (RB) and Public Grievance Redressal Cell (PGRC) are simultaneously issuing directives to the same institution on interlocking faculty grievances and cadre compliance.',
    missing_or_uncertain:
      'Whether RB EVC inspection mandate should incorporate the 7 individual PGRC faculty certificate release claims.',
    coordination_owner: 'Dr. S. Subramanian (RB Under Secretary)',
    next_required_action:
      'Review overlap and confirm joint RB–PGRC coordination order without merging separate case IDs.',
  },
  {
    relation_id: 'REL-2026-02',
    institution_id: 'INST-105',
    institution_name: 'PSG Institute of Technology & Applied Research',
    aicte_permanent_id: '1-209481723',
    case_id_a: 'CMP-2026-0136',
    case_id_b: 'CMP-2026-0135',
    bureau_a: 'Approval Bureau (AB)',
    bureau_b: 'Regional Office (SRO)',
    relation_type: 'Unacknowledged Handoff Overlap',
    match_method: 'Layer 1 Exact Permanent ID + Layer 2 Semantic Issue Match',
    match_score: 95,
    review_status: 'Confirmed Related Cases',
    reviewed_by: 'Meera Nair (Administrator)',
    reviewed_at: '2026-10-25T09:30:00Z',
    remarks:
      'Confirmed companion records: CMP-2026-0136 is the institute EoA intake petition at AB; CMP-2026-0135 is the SRO verification report transferred to AB.',
    matching_signals: [
      'Exact AICTE Permanent ID: 1-209481723',
      'Program Match: B.Tech AI & Data Science (60 to 120 intake)',
      'Active Transfer Handoff: TRF-2026-01 (SRO → AB)',
    ],
    why_raised:
      'Related cases across Regional Office (SRO) and Approval Bureau (AB) require linked handoff acceptance to issue EoA corrigendum.',
    missing_or_uncertain: 'None — relationship confirmed by reviewer.',
    coordination_owner: 'M. S. Narayanan (AB Section Officer)',
    next_required_action:
      'Accept transfer TRF-2026-01 in Approval Bureau queue and issue EoA corrigendum.',
  },
  {
    relation_id: 'REL-2026-03',
    institution_id: 'INST-103',
    institution_name: 'Apex Institute of Technology (Jaipur Identity Check)',
    aicte_permanent_id: '1-774829104 / PID-UNVERIFIED-2026-09',
    case_id_a: 'CMP-2026-0138',
    case_id_b: 'CMP-2026-0137',
    bureau_a: 'Regulation Bureau (RB)',
    bureau_b: 'Public Grievance Redressal Cell (PGRC)',
    relation_type: 'Uncertain Institution Identity Match',
    match_method: 'Layer 1 Fuzzy Name/Address Normalization (Missing/Conflicting PID)',
    match_score: 84,
    review_status: 'Institution Identity Uncertain',
    remarks:
      'Scenario C: CMP-2026-0138 cites PID 1-774829104 ("Apex Institute of Technology, Jaipur Rural"), while CMP-2026-0137 was filed without a PID against "Apex Institute of Technology & Management, Jaipur" in the same Sitapura industrial corridor.',
    matching_signals: [
      'Normalized Name Token Overlap: 84% ("apex institute of technology jaipur")',
      'Shared Geographic Corridor: Sitapura Institutional Area, Jaipur, NWRO',
      'Related Fee Grievance Theme: Unapproved development fee (RB) vs Non-refund of tuition/development fee (PGRC)',
    ],
    why_raised:
      'Missing AICTE Permanent ID on CMP-2026-0137 combined with high name/address similarity to INST-103. Automatic merge is blocked by Layer 1 safety rules.',
    missing_or_uncertain:
      'Verification from NWRO Regional Officer on whether both complaints target the same AICTE Permanent ID (1-774829104) or two sister institutions under the same trust.',
    coordination_owner: 'NWRO Regional Verification Desk',
    next_required_action:
      'Verify AICTE Permanent ID with NWRO and either confirm linked institution or mark as separate entities.',
  },
  {
    relation_id: 'REL-2026-04',
    institution_id: 'INST-111',
    institution_name: 'Kalinga Institute of Industrial & Technical Studies, Bhubaneswar',
    aicte_permanent_id: '1-440291834',
    case_id_a: 'CMP-2026-0130',
    case_id_b: 'CMP-2026-0129',
    bureau_a: 'Regulation Bureau (RB)',
    bureau_b: 'Public Grievance Redressal Cell (PGRC)',
    relation_type: 'Overlapping Regulatory & Grievance Issue',
    match_method: 'Layer 1 Exact Permanent ID + Layer 2 Semantic Issue Match',
    match_score: 87,
    review_status: 'Potential Overlap — Review Required',
    remarks:
      'RB is investigating 38 excess admissions in the MCA program (CMP-2026-0130), while 38 MCA students petitioned PGRC over unissued university exam roll numbers (CMP-2026-0129).',
    matching_signals: [
      'Exact AICTE Permanent ID: 1-440291834',
      'Exact Cohort Match: 38 first-year MCA students',
      'Cross-Bureau Dependency: PGRC cannot direct roll number generation until RB determines regulatory status of excess intake',
    ],
    why_raised:
      'Independent PGRC action could conflict with Regulation Bureau (RB) excess-admission proceedings.',
    missing_or_uncertain:
      'BPUT university affiliation roster confirmation awaited.',
    coordination_owner: 'Dr. S. Subramanian (RB Under Secretary)',
    next_required_action:
      'Confirm relationship and assign joint RB–PGRC coordination owner.',
  },
  {
    relation_id: 'REL-2026-05',
    institution_id: 'INST-102',
    institution_name: 'Government College of Engineering, Pune',
    aicte_permanent_id: '1-339104821',
    case_id_a: 'CMP-2026-0140',
    case_id_b: 'CMP-2026-0139',
    bureau_a: 'Public Grievance Redressal Cell (PGRC)',
    bureau_b: 'Approval Bureau (AB)',
    relation_type: 'Same Institution — Distinct Unrelated Issues',
    match_method: 'Layer 1 Exact Permanent ID + Distinct Category Exclusion',
    match_score: 14,
    review_status: 'Not Related — Reviewed',
    reviewed_by: 'System Rule + PGRC Officer',
    reviewed_at: '2026-10-21T10:00:00Z',
    remarks:
      'Scenario B: Both records belong to PID 1-339104821 (GCOE Pune), but CMP-2026-0140 is a student scholarship disbursement query whereas CMP-2026-0139 is a routine CAD lab stock update.',
    matching_signals: [
      'Exact AICTE Permanent ID: 1-339104821',
      'Low Semantic Overlap (14%): Unrelated domains (DBT Scholarship vs Lab Equipment Stock)',
    ],
    why_raised:
      'Evaluated during institution-level intake check and classified as separate matters requiring no cross-bureau hold.',
    missing_or_uncertain: 'None — verified unrelated issues at the same institution.',
    coordination_owner: 'No Joint Coordination Required',
    next_required_action: 'Process independently in respective Bureaus.',
  },
];

export const INITIAL_COORDINATION: CoordinationRecord[] = [
  {
    coordination_id: 'CRD-2026-01',
    institution_id: 'INST-101',
    institution_name: 'Deccan Institute of Engineering & Technology',
    aicte_permanent_id: '1-482910311',
    related_case_ids: ['CMP-2026-0142', 'CMP-2026-0141'],
    originating_bureau: 'Public Grievance Redressal Cell (PGRC)',
    involved_bureaus: [
      'Public Grievance Redressal Cell (PGRC)',
      'Regulation Bureau (RB)',
    ],
    coordination_owner: 'Dr. S. Subramanian (RB Under Secretary)',
    agreed_next_action:
      'Include PGRC withheld-certificate verification in the RB Expert Visit Committee (EVC) mandate scheduled for 28 Oct 2026.',
    due_date: '2026-10-28T18:00:00Z',
    status: 'Pending Coordination',
    latest_remark:
      'PGRC shared list of 7 affected CSE faculty members with RB inspection desk.',
    updated_at: '2026-10-25T16:50:00Z',
  },
  {
    coordination_id: 'CRD-2026-02',
    institution_id: 'INST-105',
    institution_name: 'PSG Institute of Technology & Applied Research',
    aicte_permanent_id: '1-209481723',
    related_case_ids: ['CMP-2026-0136', 'CMP-2026-0135'],
    originating_bureau: 'Regional Office (SRO)',
    involved_bureaus: ['Regional Office (SRO)', 'Approval Bureau (AB)'],
    coordination_owner: 'M. S. Narayanan (AB Section Officer)',
    agreed_next_action:
      'Acknowledge SRO physical verification transfer TRF-2026-01 and issue revised EoA intake letter.',
    due_date: '2026-10-29T18:00:00Z',
    status: 'Awaiting Transfer Acceptance',
    latest_remark:
      'SRO uploaded signed Scrutiny Committee verification sheet; awaiting AB acceptance.',
    updated_at: '2026-10-25T11:20:00Z',
  },
  {
    coordination_id: 'CRD-2026-03',
    institution_id: 'INST-111',
    institution_name: 'Kalinga Institute of Industrial & Technical Studies, Bhubaneswar',
    aicte_permanent_id: '1-440291834',
    related_case_ids: ['CMP-2026-0130', 'CMP-2026-0129'],
    originating_bureau: 'Regulation Bureau (RB)',
    involved_bureaus: [
      'Regulation Bureau (RB)',
      'Public Grievance Redressal Cell (PGRC)',
      'Regional Office (ERO)',
    ],
    coordination_owner: 'Dr. S. Subramanian (RB Under Secretary)',
    agreed_next_action:
      'Obtain BPUT university admission roster via ERO before PGRC responds to student exam roll-number petition.',
    due_date: '2026-10-27T18:00:00Z',
    status: 'Active Joint Review',
    latest_remark:
      'Joint hold placed to prevent conflicting communications to university registrar.',
    updated_at: '2026-10-25T15:35:00Z',
  },
];

export const INITIAL_TRANSFERS: TransferRecord[] = [
  {
    transfer_id: 'TRF-2026-01',
    case_id: 'CMP-2026-0135',
    case_subject:
      'Regional Scrutiny Committee physical verification report for AI & DS intake expansion',
    institution_id: 'INST-105',
    institution_name: 'PSG Institute of Technology & Applied Research',
    originating_bureau: 'Regional Office (SRO)',
    receiving_bureau: 'Approval Bureau (AB)',
    reason:
      'Regional physical inspection completed; central Approval Bureau (AB) authority required to issue amended EoA intake letter.',
    transferring_officer: 'K. Balasubramanian (SRO Regional Officer)',
    receiving_officer: 'M. S. Narayanan (AB Section Officer)',
    requested_at: '2026-10-25T11:15:00Z',
    transfer_status: 'Awaiting Acceptance',
    remarks:
      'Signed inspection annexure attached. Linked to AB petition CMP-2026-0136.',
  },
  {
    transfer_id: 'TRF-2026-02',
    case_id: 'CMP-2026-0138',
    case_subject:
      'Collection of unapproved capitation / development fee from B.Tech 1st year batch',
    institution_id: 'INST-103',
    institution_name: 'Apex Institute of Technology, Jaipur Rural',
    originating_bureau: 'Public Grievance Redressal Cell (PGRC)',
    receiving_bureau: 'Regulation Bureau (RB)',
    reason:
      'Complaint involves systemic violation of AICTE tuition/capitation fee regulations requiring RB statutory inquiry.',
    transferring_officer: 'R. K. Sharma (PGRC Nodal Officer)',
    receiving_officer: 'Dr. S. Subramanian (RB Under Secretary)',
    requested_at: '2026-10-15T14:00:00Z',
    accepted_at: '2026-10-16T10:30:00Z',
    transfer_status: 'Accepted',
    remarks:
      'Accepted by RB; linked with PGRC individual refund petition CMP-2026-0137 pending campus PID verification.',
  },
];

export const INITIAL_ESCALATIONS: EscalationRecord[] = [
  {
    escalation_id: 'ESC-2026-01',
    case_id: 'CMP-2026-0134',
    case_subject:
      'Delayed CAS promotion and 7th CPC arrears for senior Mechanical Engineering faculty',
    institution_id: 'INST-106',
    institution_name: 'L.D. College of Engineering, Ahmedabad',
    reason:
      'Case exceeded configured disposal deadline (23 Oct 2026) with two unanswered reminders.',
    escalation_level: 'Level 2 — Competent Authority / Senior Management',
    responsible_authority: 'Advisor-I (Regulation & Faculty Grievance)',
    bureau: 'Faculty Grievance Cell (FGC)',
    timestamp: '2026-10-24T17:30:00Z',
    required_next_action:
      'Approve formal hearing notice to institutional administration and State DTE.',
    status: 'Awaiting Action',
  },
  {
    escalation_id: 'ESC-2026-02',
    case_id: 'CMP-2026-0142',
    case_subject:
      'Original degree certificates and 6-month salary arrears withheld for resigning CSE faculty',
    institution_id: 'INST-101',
    institution_name: 'Deccan Institute of Engineering & Technology',
    reason:
      'Critical cross-bureau overlap between PGRC and RB involving retention of original academic credentials.',
    escalation_level: 'Level 1 — Bureau Head',
    responsible_authority: 'Director, Public Grievance Redressal Cell',
    bureau: 'Public Grievance Redressal Cell (PGRC)',
    timestamp: '2026-10-25T15:00:00Z',
    required_next_action:
      'Co-sign joint inspection instruction with Regulation Bureau (RB).',
    status: 'Acknowledged',
  },
];

export const INITIAL_ALERTS: AlertRecord[] = [
  {
    alert_id: 'ALT-2026-01',
    alert_type: 'Potential Overlapping Cases',
    case_ids: ['CMP-2026-0142', 'CMP-2026-0141'],
    institution_id: 'INST-101',
    institution_name: 'Deccan Institute of Engineering & Technology',
    aicte_permanent_id: '1-482910311',
    bureaus: [
      'Public Grievance Redressal Cell (PGRC)',
      'Regulation Bureau (RB)',
    ],
    severity: 'Critical',
    reason:
      'Simultaneous PGRC directive and RB Expert Visit Committee (EVC) initiated on interlocking CSE faculty grievances and cadre deficit.',
    recommended_action:
      'Review overlap in Overlap Detection and confirm joint RB–PGRC coordination action.',
    created_at: '2026-10-19T11:10:00Z',
    due_at: '2026-10-28T18:00:00Z',
    assigned_to: 'Dr. S. Subramanian (RB) & R. K. Sharma (PGRC)',
    acknowledgement_status: 'Unacknowledged',
    resolution_status: 'Open',
  },
  {
    alert_id: 'ALT-2026-02',
    alert_type: 'Institution Identity Verification',
    case_ids: ['CMP-2026-0138', 'CMP-2026-0137'],
    institution_id: 'INST-103',
    institution_name: 'Apex Institute of Technology (Jaipur Sitapura Corridor)',
    aicte_permanent_id: '1-774829104 / PID-UNVERIFIED',
    bureaus: [
      'Regulation Bureau (RB)',
      'Public Grievance Redressal Cell (PGRC)',
    ],
    severity: 'High',
    reason:
      '84% fuzzy name/address match in Sitapura, Jaipur with missing Permanent ID on CMP-2026-0137. Auto-merge blocked.',
    recommended_action:
      'Verify institution identity before linking RB capitation fee inquiry with PGRC refund grievance.',
    created_at: '2026-10-22T11:20:00Z',
    due_at: '2026-10-27T18:00:00Z',
    assigned_to: 'NWRO Regional Verification Officer',
    acknowledgement_status: 'Unacknowledged',
    resolution_status: 'Open',
  },
  {
    alert_id: 'ALT-2026-03',
    alert_type: 'Overdue Case',
    case_ids: ['CMP-2026-0134'],
    institution_id: 'INST-106',
    institution_name: 'L.D. College of Engineering, Ahmedabad',
    aicte_permanent_id: '1-558291034',
    bureaus: ['Faculty Grievance Cell (FGC)'],
    severity: 'Critical',
    reason:
      'Expected disposal date (23 Oct 2026) elapsed for CAS promotion & 7th CPC arrears grievance.',
    recommended_action:
      'Expedite Level-2 escalation hearing notice in Transfers & Escalations.',
    created_at: '2026-10-24T09:00:00Z',
    due_at: '2026-10-23T18:00:00Z',
    assigned_to: 'Smt. Vandana Joshi (FGC Officer)',
    acknowledgement_status: 'Acknowledged',
    resolution_status: 'Open',
  },
  {
    alert_id: 'ALT-2026-04',
    alert_type: 'Cases Pending Transfer Acceptance',
    case_ids: ['CMP-2026-0135', 'CMP-2026-0136'],
    institution_id: 'INST-105',
    institution_name: 'PSG Institute of Technology & Applied Research',
    aicte_permanent_id: '1-209481723',
    bureaus: ['Regional Office (SRO)', 'Approval Bureau (AB)'],
    severity: 'High',
    reason:
      'Transfer TRF-2026-01 from SRO to Approval Bureau (AB) is awaiting formal acceptance.',
    recommended_action:
      'Accept transfer in Bureau/Cell Coordination or Transfers screen.',
    created_at: '2026-10-25T11:15:00Z',
    due_at: '2026-10-29T18:00:00Z',
    assigned_to: 'M. S. Narayanan (AB Section Officer)',
    acknowledgement_status: 'Unacknowledged',
    resolution_status: 'Open',
  },
  {
    alert_id: 'ALT-2026-05',
    alert_type: 'Cases Awaiting Bureau Coordination',
    case_ids: ['CMP-2026-0130', 'CMP-2026-0129'],
    institution_id: 'INST-111',
    institution_name: 'Kalinga Institute of Industrial & Technical Studies, Bhubaneswar',
    aicte_permanent_id: '1-440291834',
    bureaus: [
      'Regulation Bureau (RB)',
      'Public Grievance Redressal Cell (PGRC)',
    ],
    severity: 'Critical',
    reason:
      '38 MCA students awaiting exam roll numbers (PGRC) while RB investigates excess MCA intake.',
    recommended_action:
      'Coordinate joint RB–PGRC response prior to 27 Oct 2026 deadline.',
    created_at: '2026-10-25T15:30:00Z',
    due_at: '2026-10-27T18:00:00Z',
    assigned_to: 'Dr. S. Subramanian (RB Under Secretary)',
    acknowledgement_status: 'Unacknowledged',
    resolution_status: 'Open',
  },
];

export const INITIAL_MODEL_EVALUATIONS: ModelEvaluationMetric[] = [
  {
    evaluation_id: 'EVAL-2026-L1',
    model_version: 'CaseSync-EntityMatcher-v1.4 (Deterministic PID + Fuzzy Name/Address)',
    evaluation_dataset_reference: 'SIH Illustrative Benchmark Pair Set (n = 120 pairs)',
    evaluated_at: '2026-10-20T10:00:00Z',
    task_name: 'Layer 1: Institution Entity Resolution (Missing/Noisy PID)',
    precision: 0.91,
    recall: 0.88,
    f1_score: 0.89,
    false_positives: 3,
    false_negatives: 4,
    sample_count: 120,
    notes:
      'Exact AICTE Permanent ID matches achieve 1.00 precision. Fuzzy name/PIN matching routes scores between 0.70 and 0.90 to mandatory human review.',
  },
  {
    evaluation_id: 'EVAL-2026-L2',
    model_version: 'CaseSync-CrossBureau-Overlap-v1.2 (Hybrid Semantic + Rule Engine)',
    evaluation_dataset_reference: 'SIH Cross-Bureau Validation Corpus (n = 85 case pairs)',
    evaluated_at: '2026-10-20T10:00:00Z',
    task_name: 'Layer 2 & 3: Related-Case & Cross-Bureau Overlap Detection',
    precision: 0.86,
    recall: 0.89,
    f1_score: 0.87,
    false_positives: 5,
    false_negatives: 4,
    sample_count: 85,
    notes:
      'Offline evaluation metrics on illustrative benchmark dataset. Live operational match scores represent signal alignment, not calibrated probabilities of duplication.',
  },
];

export function computeDeadlineState(
  caseOrDueAt:
    | Pick<CaseRecord, 'status' | 'expected_disposal_at'>
    | string,
  statusOrDays?: CaseStatus | number,
  slaConfig?: SlaConfig
): DeadlineState {
  const status =
    typeof caseOrDueAt === 'string'
      ? (statusOrDays as CaseStatus)
      : caseOrDueAt.status;
  const expected_disposal_at =
    typeof caseOrDueAt === 'string'
      ? caseOrDueAt
      : caseOrDueAt.expected_disposal_at;
  const dueSoonDays =
    typeof statusOrDays === 'number'
      ? statusOrDays
      : slaConfig?.dueSoonDaysThreshold ?? 4;

  if (status === 'Disposed') {
    return 'On Track';
  }
  if (!expected_disposal_at) {
    return 'Deadline Not Configured';
  }
  // Reference current date in prototype context: 2026-10-26
  const refNow = new Date('2026-10-26T12:00:00Z').getTime();
  const dueTime = new Date(expected_disposal_at).getTime();
  if (Number.isNaN(dueTime)) return 'Deadline Not Configured';

  const diffDays = (dueTime - refNow) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) {
    return 'Overdue';
  }
  if (diffDays <= dueSoonDays) {
    return 'Due Soon';
  }
  return 'On Track';
}

export function normalizeInstitutionName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(and|of|the|for|in|at)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function classifyAndMatchComplaint(
  description: string,
  title: string,
  institutionName: string,
  aictePermanentId: string,
  existingCases: CaseRecord[],
  institutions: InstitutionRecord[],
  rules: RoutingRule[] = INITIAL_ROUTING_RULES
) {
  const combined = `${title} ${description}`.toLowerCase();

  let bestRule = rules[1]; // Default PGRC
  let bestMatches: string[] = [];
  let maxScore = 0;

  for (const r of rules) {
    const matched = r.keywords.filter((kw) =>
      combined.includes(kw.toLowerCase())
    );
    if (matched.length > maxScore) {
      maxScore = matched.length;
      bestRule = r;
      bestMatches = matched;
    }
  }

  // Layer 1: Institution Identity Resolution
  const cleanPid = aictePermanentId.trim();
  const exactInst = cleanPid
    ? institutions.find(
        (inst) =>
          inst.aicte_permanent_id.toLowerCase() === cleanPid.toLowerCase()
      )
    : undefined;

  const normInputName = normalizeInstitutionName(institutionName);
  const fuzzyInst = !exactInst
    ? institutions.find((inst) => {
        const tokensA = inst.normalized_name.split(' ');
        const tokensB = normInputName.split(' ');
        const overlap = tokensA.filter((t) => t.length > 2 && tokensB.includes(t));
        return overlap.length >= 2;
      })
    : undefined;

  const matchedInstitution = exactInst || fuzzyInst;
  const isIdentityUncertain = !exactInst && Boolean(fuzzyInst);

  // Layer 2 & 3: Check existing cases at the matched institution
  const instCases = matchedInstitution
    ? existingCases.filter(
        (c) =>
          c.institution_id === matchedInstitution.institution_id &&
          c.status !== 'Disposed'
      )
    : [];

  const crossBureauCases = instCases.filter(
    (c) => c.current_bureau !== bestRule.defaultDepartment
  );

  const confidence = Math.min(94, 76 + bestMatches.length * 5);

  return {
    predictedCategory: bestRule.category,
    recommendedDepartment: bestRule.defaultDepartment,
    priority: bestRule.defaultPriority as Priority,
    confidence,
    classificationSource: 'deterministic-rules' as const,
    matchedInstitution,
    isIdentityUncertain,
    relatedCaseIds: crossBureauCases.map((c) => c.id),
    explanation: {
      summary:
        crossBureauCases.length > 0
          ? `Matched institution ${matchedInstitution?.name} (${matchedInstitution?.aicte_permanent_id}) with ${crossBureauCases.length} active case(s) in other Bureaus (${crossBureauCases.map((c) => c.id).join(', ')}).`
          : `Classified under "${bestRule.category}" and routed to ${bestRule.defaultDepartment}.`,
      matchedSignals:
        bestMatches.length > 0 ? bestMatches : ['institutional-complaint-intake'],
      routingRuleApplied: `${bestRule.category} → ${bestRule.defaultDepartment}`,
      confidenceNote: isIdentityUncertain
        ? 'Uncertain institution identity match (missing exact Permanent ID); flagged for officer verification.'
        : 'Exact Permanent ID & domain rule evaluation.',
    },
  };
}
