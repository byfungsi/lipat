import type { TemplateRecipe } from "./template-types";

/** Thirty complete narratives for learning, research, technical speaking and marketing. */
export const audienceTemplates: readonly TemplateRecipe[] = [
  {
    id: "course-project",
    name: "Course Project",
    domain: "Course project presentation",
    category: "education",
    description:
      "A clear project story: the question, the work, the result and what you learned.",
    palette: ["#F3F6FC", "#192D4B", "#356CB6", "#7DA7BB"],
    font: "Arial",
    slides: [
      {
        layout: "cover",
        title: "An idea. Made real.",
        body: "A clear project story: the question, the work, the result and what you learned.",
        label: "Course project presentation",
      },
      {
        layout: "statement",
        title: "A small problem worth solving.",
        body: "Students lose time finding a quiet place to work between classes.",
        items: [
          {
            label: "Our question",
            detail: "Can shared information reduce the search?",
          },
        ],
      },
      {
        layout: "process",
        title: "From observation to a working idea.",
        body: "Show the choices that shaped the project.",
        items: [
          {
            label: "Observe",
            detail: "Map common study routines.",
          },
          {
            label: "Prototype",
            detail: "Build a simple space finder.",
          },
          {
            label: "Try",
            detail: "Ask peers to complete one task.",
          },
        ],
      },
      {
        layout: "chart",
        title: "The second version made the task easier.",
        body: "Illustrative median task time in seconds; six peers tried both versions.",
        chart: {
          kind: "bar",
          categories: ["First version", "Revised version"],
          series: [
            {
              name: "Task time (sample seconds)",
              values: [72, 41],
            },
          ],
          showLegend: true,
          showValues: false,
        },
      },
      {
        layout: "matrix",
        title: "What changed our thinking.",
        body: "Connect each lesson to a specific next action.",
        items: [
          {
            label: "Scope",
            detail: "One useful task beats a crowded feature list.",
          },
          {
            label: "Evidence",
            detail: "Watch behavior before asking for opinions.",
          },
          {
            label: "Access",
            detail: "Include students with different schedules.",
          },
          {
            label: "Next test",
            detail: "Try the idea during a busy week.",
          },
        ],
      },
      {
        layout: "cta",
        title: "Keep the question open.",
        body: "The next iteration should test the assumption we understand least.",
        items: [
          {
            label: "Show",
            detail: "Demonstrate one complete task.",
          },
          {
            label: "Ask",
            detail: "Invite one challenging question.",
          },
          {
            label: "Improve",
            detail: "Choose one change to test.",
          },
        ],
      },
    ],
  },
  {
    id: "literature-seminar",
    name: "Literature Seminar",
    domain: "Humanities seminar",
    category: "education",
    description:
      "Build a thoughtful interpretation through a claim, close reading and a competing view.",
    palette: ["#F7F3EB", "#303B34", "#6C805D", "#C4A776"],
    font: "Georgia",
    slides: [
      {
        layout: "cover",
        title: "Read between the lines.",
        body: "Build a thoughtful interpretation through a claim, close reading and a competing view.",
        label: "Humanities seminar",
      },
      {
        layout: "statement",
        title: "A recurring detail changes the reading.",
        body: "In this fictional text, the threshold marks a choice between belonging and independence.",
        items: [],
      },
      {
        layout: "cards",
        title: "Three passages, one developing idea.",
        body: "Replace the descriptions with cited passages from your assigned text.",
        items: [
          {
            label: "Opening",
            detail: "The doorway offers safety.",
          },
          {
            label: "Turning point",
            detail: "The same doorway becomes a barrier.",
          },
          {
            label: "Ending",
            detail: "Crossing it becomes a deliberate choice.",
          },
        ],
      },
      {
        layout: "compare",
        title: "A different reading is possible.",
        body: "Test the interpretation against an alternative.",
        items: [
          {
            label: "Social lens",
            detail: "The boundary reflects community expectations.",
          },
          {
            label: "Our reading",
            detail: "The repeated detail tracks personal agency.",
          },
          {
            label: "Challenge",
            detail: "Whose perspective does the text omit?",
          },
        ],
      },
      {
        layout: "agenda",
        title: "Open the discussion with evidence.",
        body: "Give the group time to read before asking for a response.",
        items: [
          {
            label: "Close reading",
            detail: "Notice one word or image.",
            metric: "02 min",
          },
          {
            label: "Counterpoint",
            detail: "Find a passage that complicates the claim.",
            metric: "05 min",
          },
          {
            label: "Synthesis",
            detail: "Revise the interpretation together.",
            metric: "03 min",
          },
        ],
      },
      {
        layout: "cta",
        title: "Leave with a better question.",
        body: "Which detail changes meaning when the narrator changes?",
        items: [
          {
            label: "Cite",
            detail: "Add edition and page references.",
          },
          {
            label: "Compare",
            detail: "Bring one alternative reading.",
          },
          {
            label: "Reflect",
            detail: "State what remains uncertain.",
          },
        ],
      },
    ],
  },
  {
    id: "lab-report",
    name: "Lab Report",
    domain: "Student laboratory report",
    category: "education",
    description:
      "Present an experiment through its hypothesis, method, observations and limits.",
    palette: ["#F3F6FC", "#192D4B", "#356CB6", "#7DA7BB"],
    font: "Arial",
    slides: [
      {
        layout: "cover",
        title: "Observe. Measure. Learn.",
        body: "Present an experiment through its hypothesis, method, observations and limits.",
        label: "Student laboratory report",
      },
      {
        layout: "split",
        title: "Make the hypothesis testable.",
        body: "A longer mixing time may increase the uniformity of a harmless model solution.",
        items: [
          {
            label: "Independent",
            detail: "Mixing duration.",
          },
          {
            label: "Dependent",
            detail: "Variation between repeated readings.",
          },
        ],
      },
      {
        layout: "process",
        title: "Change one factor at a time.",
        body: "Use the same sample volume and measurement procedure.",
        items: [
          {
            label: "Prepare",
            detail: "Label equal samples and record conditions.",
          },
          {
            label: "Measure",
            detail: "Repeat each duration three times.",
          },
          {
            label: "Compare",
            detail: "Calculate the spread of readings.",
          },
        ],
      },
      {
        layout: "chart",
        title: "Variation fell as mixing time increased.",
        body: "Fictional classroom data: standard deviation in arbitrary units.",
        chart: {
          kind: "line",
          categories: ["10 sec", "20 sec", "30 sec", "40 sec"],
          series: [
            {
              name: "Variation (sample units)",
              values: [8, 5, 3, 2],
            },
          ],
          showLegend: true,
          showValues: false,
        },
      },
      {
        layout: "matrix",
        title: "Separate observation from explanation.",
        body: "The pattern supports a narrower claim than a universal rule.",
        items: [
          {
            label: "Observed",
            detail: "Variation decreased in these trials.",
          },
          {
            label: "Uncertainty",
            detail: "Reading precision limits small differences.",
          },
          {
            label: "Control",
            detail: "Keep sample volume and temperature fixed.",
          },
          {
            label: "Repeat",
            detail: "Try additional durations and fresh samples.",
          },
        ],
      },
      {
        layout: "cta",
        title: "Make the experiment reproducible.",
        body: "Attach the raw readings and the exact procedure.",
        items: [
          {
            label: "Record",
            detail: "Include units and equipment settings.",
          },
          {
            label: "Explain",
            detail: "Report exclusions and anomalies.",
          },
          {
            label: "Repeat",
            detail: "Propose one useful follow-up.",
          },
        ],
      },
    ],
  },
  {
    id: "capstone-showcase",
    name: "Capstone Showcase",
    domain: "Student capstone showcase",
    category: "education",
    description:
      "Show the problem, prototype, evaluation and learning behind a student-built solution.",
    palette: ["#131B29", "#F2F5FA", "#8CBADF", "#ADAAE0"],
    font: "Arial",
    slides: [
      {
        layout: "cover",
        title: "Built to be useful.",
        body: "Show the problem, prototype, evaluation and learning behind a student-built solution.",
        label: "Student capstone showcase",
      },
      {
        layout: "quote",
        title: "Design begins with a real constraint.",
        body: "I need to know the next step without learning a whole new system.",
        items: [
          {
            label: "Illustrative participant",
            detail: "Fictional feedback for a capstone example.",
          },
        ],
      },
      {
        layout: "portfolio",
        title: "A prototype with one clear promise.",
        body: "A shared task station helps a small team see what needs attention.",
        items: [
          {
            label: "Notice",
            detail: "A visible signal for pending work.",
          },
          {
            label: "Act",
            detail: "One control for the next useful step.",
          },
          {
            label: "Confirm",
            detail: "Clear feedback when a task is complete.",
          },
        ],
      },
      {
        layout: "chart",
        title: "Most participants completed the core task.",
        body: "Illustrative pilot counts; small samples describe this test only.",
        chart: {
          kind: "doughnut",
          categories: ["Completed", "Needed help"],
          series: [
            {
              name: "Participants",
              values: [8, 2],
            },
          ],
          showLegend: true,
          showValues: false,
        },
      },
      {
        layout: "timeline",
        title: "From prototype to a better second version.",
        body: "Use the evaluation to choose the next development step.",
        items: [
          {
            label: "Simplify",
            detail: "Remove an unused control.",
          },
          {
            label: "Include",
            detail: "Test a wider range of access needs.",
          },
          {
            label: "Validate",
            detail: "Run the task in its real setting.",
          },
        ],
      },
      {
        layout: "cta",
        title: "Try the working prototype.",
        body: "A short demonstration is the best starting point for feedback.",
        items: [
          {
            label: "Explore",
            detail: "Complete the main task.",
          },
          {
            label: "Question",
            detail: "Challenge one design choice.",
          },
          {
            label: "Connect",
            detail: "Suggest a useful test partner.",
          },
        ],
      },
    ],
  },
  {
    id: "study-group",
    name: "Study Group",
    domain: "Peer study session",
    category: "education",
    description:
      "Run a peer-led study session with retrieval practice, worked examples and reflection.",
    palette: ["#EDF4EF", "#203C33", "#3F795F", "#A1AF77"],
    font: "Arial",
    slides: [
      {
        layout: "cover",
        title: "Learn it. Together.",
        body: "Run a peer-led study session with retrieval practice, worked examples and reflection.",
        label: "Peer study session",
      },
      {
        layout: "agenda",
        title: "A session with a clear rhythm.",
        body: "Choose one topic and keep the group actively involved.",
        items: [
          {
            label: "Recall",
            detail: "Write what you remember without notes.",
            metric: "05 min",
          },
          {
            label: "Explain",
            detail: "Work through one example together.",
            metric: "15 min",
          },
          {
            label: "Apply",
            detail: "Try a fresh problem independently.",
            metric: "10 min",
          },
        ],
      },
      {
        layout: "cards",
        title: "Explain the idea three ways.",
        body: "Different representations reveal different gaps.",
        items: [
          {
            label: "In words",
            detail: "State the idea in one plain sentence.",
          },
          {
            label: "In a picture",
            detail: "Draw the relationships or sequence.",
          },
          {
            label: "In practice",
            detail: "Use the idea in a small example.",
          },
        ],
      },
      {
        layout: "compare",
        title: "Compare approaches, not just answers.",
        body: "Use a fictional probability exercise to discuss reasoning.",
        items: [
          {
            label: "First attempt",
            detail: "Add outcomes without checking overlap.",
          },
          {
            label: "Revised method",
            detail: "Identify the sample space first.",
          },
          {
            label: "Check",
            detail: "Explain why the answer is plausible.",
          },
        ],
      },
      {
        layout: "matrix",
        title: "Turn confusion into a useful question.",
        body: "Make uncertainty specific enough for someone else to help.",
        items: [
          {
            label: "Definition",
            detail: "Which term is unclear?",
          },
          {
            label: "Step",
            detail: "Where does the reasoning break?",
          },
          {
            label: "Example",
            detail: "Which case does not seem to fit?",
          },
          {
            label: "Connection",
            detail: "What earlier idea is missing?",
          },
        ],
      },
      {
        layout: "cta",
        title: "Leave with a small practice plan.",
        body: "Choose one problem to revisit before the next session.",
        items: [
          {
            label: "Retrieve",
            detail: "Try it without looking at notes.",
          },
          {
            label: "Check",
            detail: "Explain the reasoning aloud.",
          },
          {
            label: "Return",
            detail: "Bring the remaining question.",
          },
        ],
      },
    ],
  },
  {
    id: "debate-case",
    name: "Debate Case",
    domain: "Student debate argument",
    category: "education",
    description:
      "Build an evidence-led debate with a clear motion, warrants, rebuttals and weighing.",
    palette: ["#F7F3EB", "#303B34", "#6C805D", "#C4A776"],
    font: "Georgia",
    slides: [
      {
        layout: "cover",
        title: "Make a case. Hear another.",
        body: "Build an evidence-led debate with a clear motion, warrants, rebuttals and weighing.",
        label: "Student debate argument",
      },
      {
        layout: "statement",
        title: "Define the motion before defending it.",
        body: "This practice debate asks whether a campus should extend library opening hours.",
        items: [],
      },
      {
        layout: "cards",
        title: "A claim needs a reason and support.",
        body: "Replace the sample claims with evidence from credible sources.",
        items: [
          {
            label: "Access",
            detail: "Students have different study schedules.",
          },
          {
            label: "Capacity",
            detail: "Evening demand may exceed available seats.",
          },
          {
            label: "Conditions",
            detail: "Staffing and transport affect feasibility.",
          },
        ],
      },
      {
        layout: "compare",
        title: "Engage the strongest counterargument.",
        body: "Acknowledge the tradeoff before offering a response.",
        items: [
          {
            label: "Concern",
            detail: "Extra hours create recurring costs.",
          },
          {
            label: "Response",
            detail: "A limited pilot can test actual demand.",
          },
          {
            label: "Remaining issue",
            detail: "Benefits must justify the resource use.",
          },
        ],
      },
      {
        layout: "matrix",
        title: "Weigh the arguments on a shared basis.",
        body: "Explain why one consideration matters more in this context.",
        items: [
          {
            label: "Reach",
            detail: "How many students benefit?",
          },
          {
            label: "Magnitude",
            detail: "How much does access improve?",
          },
          {
            label: "Confidence",
            detail: "How strong is the evidence?",
          },
          {
            label: "Tradeoff",
            detail: "What else could the resources support?",
          },
        ],
      },
      {
        layout: "cta",
        title: "Return to the motion.",
        body: "State the case in one sentence, then identify the decisive reason.",
        items: [
          {
            label: "Claim",
            detail: "Make the position explicit.",
          },
          {
            label: "Weigh",
            detail: "Compare the strongest tradeoff.",
          },
          {
            label: "Conclude",
            detail: "Give the audience a clear judgment.",
          },
        ],
      },
    ],
  },
  {
    id: "internship-reflection",
    name: "Internship Reflection",
    domain: "Internship learning review",
    category: "education",
    description:
      "Reflect on an internship through a contribution, a challenge and a concrete growth plan.",
    palette: ["#FFF4E5", "#4C332B", "#B96548", "#6E8F80"],
    font: "Georgia",
    slides: [
      {
        layout: "cover",
        title: "Work. Learn. Find your way.",
        body: "Reflect on an internship through a contribution, a challenge and a concrete growth plan.",
        label: "Internship learning review",
      },
      {
        layout: "split",
        title: "Begin with the work you joined.",
        body: "A fictional placement supported a small team improving its internal knowledge base.",
        items: [
          {
            label: "Role",
            detail: "Research, organize and test content.",
          },
          {
            label: "Context",
            detail: "A short placement with limited access.",
          },
        ],
      },
      {
        layout: "portfolio",
        title: "One contribution, made visible.",
        body: "Show a before-and-after example without exposing confidential material.",
        items: [
          {
            label: "Before",
            detail: "Answers lived in scattered documents.",
          },
          {
            label: "Contribution",
            detail: "A clearer structure and search labels.",
          },
          {
            label: "After",
            detail: "A small team could find common answers.",
          },
        ],
      },
      {
        layout: "cards",
        title: "Three skills became more concrete.",
        body: "Describe an action rather than listing an abstract skill.",
        items: [
          {
            label: "Listening",
            detail: "Turn broad requests into specific questions.",
          },
          {
            label: "Judgment",
            detail: "Choose a useful scope for a short deadline.",
          },
          {
            label: "Communication",
            detail: "Explain a decision to a new audience.",
          },
        ],
      },
      {
        layout: "timeline",
        title: "A moment that changed the approach.",
        body: "A first draft failed because it reflected the author’s organization.",
        items: [
          {
            label: "Notice",
            detail: "Users searched with different language.",
          },
          {
            label: "Adapt",
            detail: "Observe searches and revise labels.",
          },
          {
            label: "Learn",
            detail: "Test the structure before polishing it.",
          },
        ],
      },
      {
        layout: "cta",
        title: "Carry the learning forward.",
        body: "Choose a next step that builds on the placement.",
        items: [
          {
            label: "Practice",
            detail: "Repeat one useful skill weekly.",
          },
          {
            label: "Seek",
            detail: "Ask for specific feedback.",
          },
          {
            label: "Explore",
            detail: "Identify a role to learn more about.",
          },
        ],
      },
    ],
  },
  {
    id: "scholarship-story",
    name: "Scholarship Story",
    domain: "Scholarship interview presentation",
    category: "education",
    description:
      "Connect a personal motivation, demonstrated effort and a realistic plan for further study.",
    palette: ["#F5F1FA", "#302A47", "#7154A5", "#B583A6"],
    font: "Georgia",
    slides: [
      {
        layout: "cover",
        title: "A path with purpose.",
        body: "Connect a personal motivation, demonstrated effort and a realistic plan for further study.",
        label: "Scholarship interview presentation",
      },
      {
        layout: "statement",
        title: "A question became a direction.",
        body: "This fictional applicant wants to understand how everyday spaces affect access to learning.",
        items: [],
      },
      {
        layout: "timeline",
        title: "Show a pattern of sustained effort.",
        body: "Use verified experiences and describe your own contribution.",
        items: [
          {
            label: "Learn",
            detail: "Complete a relevant course or project.",
          },
          {
            label: "Apply",
            detail: "Try the idea in a community setting.",
          },
          {
            label: "Reflect",
            detail: "Use feedback to refine the question.",
          },
        ],
      },
      {
        layout: "cards",
        title: "Why this program fits the next step.",
        body: "Match specific learning opportunities to a clear development need.",
        items: [
          {
            label: "Knowledge",
            detail: "Build a stronger theoretical foundation.",
          },
          {
            label: "Methods",
            detail: "Learn to evaluate a practical intervention.",
          },
          {
            label: "Community",
            detail: "Work with people who challenge the idea.",
          },
        ],
      },
      {
        layout: "matrix",
        title: "A realistic plan for the opportunity.",
        body: "Show how you will use the time and support well.",
        items: [
          {
            label: "First term",
            detail: "Strengthen core methods.",
          },
          {
            label: "Project",
            detail: "Test a focused research question.",
          },
          {
            label: "Contribution",
            detail: "Share useful findings with peers.",
          },
          {
            label: "Long term",
            detail: "Apply the learning in a relevant setting.",
          },
        ],
      },
      {
        layout: "cta",
        title: "Make the purpose memorable.",
        body: "End with the work you hope to become capable of doing.",
        items: [
          {
            label: "Direction",
            detail: "Name the question that motivates you.",
          },
          {
            label: "Readiness",
            detail: "Point to one demonstrated commitment.",
          },
          {
            label: "Contribution",
            detail: "Explain who could benefit.",
          },
        ],
      },
    ],
  },
  {
    id: "research-proposal",
    name: "Research Proposal",
    domain: "Research proposal review",
    category: "research",
    description:
      "Move from a research gap to a feasible study with clear measures, risks and milestones.",
    palette: ["#F7F3EB", "#303B34", "#6C805D", "#C4A776"],
    font: "Georgia",
    slides: [
      {
        layout: "cover",
        title: "A question worth testing.",
        body: "Move from a research gap to a feasible study with clear measures, risks and milestones.",
        label: "Research proposal review",
      },
      {
        layout: "statement",
        title: "The gap is narrower than the topic.",
        body: "We know little about how handoff timing affects coordination in small distributed teams.",
        items: [],
      },
      {
        layout: "cards",
        title: "Three questions define the study.",
        body: "Keep each question connected to an observable outcome.",
        items: [
          {
            label: "Pattern",
            detail: "When do delays appear?",
          },
          {
            label: "Mechanism",
            detail: "What information is missing at handoff?",
          },
          {
            label: "Variation",
            detail: "Which conditions change the effect?",
          },
        ],
      },
      {
        layout: "process",
        title: "Choose a method that answers the question.",
        body: "An illustrative mixed-method design combines logs and interviews.",
        items: [
          {
            label: "Observe",
            detail: "Collect a bounded set of handoff records.",
          },
          {
            label: "Explain",
            detail: "Interview participants about selected events.",
          },
          {
            label: "Integrate",
            detail: "Compare accounts with observed patterns.",
          },
        ],
      },
      {
        layout: "timeline",
        title: "A feasible first study.",
        body: "Use checkpoints to discover problems before full collection.",
        items: [
          {
            label: "Pilot",
            detail: "Test access, measures and procedure.",
          },
          {
            label: "Collect",
            detail: "Gather the approved sample.",
          },
          {
            label: "Analyze",
            detail: "Report patterns and alternative explanations.",
          },
        ],
      },
      {
        layout: "cta",
        title: "Resolve the design decisions first.",
        body: "Seek feedback on the question and method before scaling the study.",
        items: [
          {
            label: "Scope",
            detail: "Confirm the population and boundary.",
          },
          {
            label: "Method",
            detail: "Challenge the proposed measures.",
          },
          {
            label: "Review",
            detail: "Identify required ethics and access steps.",
          },
        ],
      },
    ],
  },
  {
    id: "literature-map",
    name: "Literature Map",
    domain: "Research literature synthesis",
    category: "research",
    description:
      "Synthesize a field by themes, disagreements and gaps rather than presenting a list of papers.",
    palette: ["#FFF4E5", "#4C332B", "#B96548", "#6E8F80"],
    font: "Georgia",
    slides: [
      {
        layout: "cover",
        title: "Find the missing thread.",
        body: "Synthesize a field by themes, disagreements and gaps rather than presenting a list of papers.",
        label: "Research literature synthesis",
      },
      {
        layout: "split",
        title: "Make the review boundary visible.",
        body: "This example maps how teams share knowledge during asynchronous work.",
        items: [
          {
            label: "Include",
            detail: "Studies of small distributed teams.",
          },
          {
            label: "Exclude",
            detail: "Unrelated individual productivity research.",
          },
        ],
      },
      {
        layout: "matrix",
        title: "Four themes organize the evidence.",
        body: "Replace these themes with your coded synthesis and citations.",
        items: [
          {
            label: "Visibility",
            detail: "How work becomes observable.",
          },
          {
            label: "Timing",
            detail: "When information reaches the next person.",
          },
          {
            label: "Trust",
            detail: "Why people rely on a shared record.",
          },
          {
            label: "Maintenance",
            detail: "How knowledge stays useful over time.",
          },
        ],
      },
      {
        layout: "compare",
        title: "The disagreement reveals a useful distinction.",
        body: "Different settings may explain apparently conflicting findings.",
        items: [
          {
            label: "View one",
            detail: "More documentation improves coordination.",
          },
          {
            label: "Synthesis",
            detail: "Usefulness depends on timing and context.",
          },
          {
            label: "View two",
            detail: "More documentation creates search burden.",
          },
        ],
      },
      {
        layout: "cards",
        title: "A gap should lead to a researchable question.",
        body: "Distinguish missing evidence from an uninteresting omission.",
        items: [
          {
            label: "Population",
            detail: "Which settings are underrepresented?",
          },
          {
            label: "Mechanism",
            detail: "What explanation remains untested?",
          },
          {
            label: "Method",
            detail: "Which measures fail to capture the process?",
          },
        ],
      },
      {
        layout: "cta",
        title: "Turn the map into a study.",
        body: "Choose one gap and explain how new evidence would change understanding.",
        items: [
          {
            label: "Cite",
            detail: "Attach a complete source table.",
          },
          {
            label: "Bound",
            detail: "State the proposed contribution.",
          },
          {
            label: "Test",
            detail: "Identify the smallest useful study.",
          },
        ],
      },
    ],
  },
  {
    id: "methods-protocol",
    name: "Methods Protocol",
    domain: "Research protocol walkthrough",
    category: "research",
    description:
      "Explain a reproducible protocol with sampling, measures, procedure and decision rules.",
    palette: ["#F3F6FC", "#192D4B", "#356CB6", "#7DA7BB"],
    font: "Arial",
    slides: [
      {
        layout: "cover",
        title: "Make the method clear.",
        body: "Explain a reproducible protocol with sampling, measures, procedure and decision rules.",
        label: "Research protocol walkthrough",
      },
      {
        layout: "cards",
        title: "Define the sample before collection.",
        body: "This fictional protocol studies task handoffs in small teams.",
        items: [
          {
            label: "Unit",
            detail: "One documented handoff event.",
          },
          {
            label: "Eligibility",
            detail: "A task with an identifiable sender and receiver.",
          },
          {
            label: "Sampling",
            detail: "A defined collection window and source.",
          },
        ],
      },
      {
        layout: "process",
        title: "A procedure someone else can follow.",
        body: "Record each step and keep a versioned protocol.",
        items: [
          {
            label: "Prepare",
            detail: "Confirm access and anonymize identifiers.",
          },
          {
            label: "Collect",
            detail: "Apply the same extraction procedure.",
          },
          {
            label: "Check",
            detail: "Audit a subset against the source.",
          },
        ],
      },
      {
        layout: "matrix",
        title: "Specify the measures and their limits.",
        body: "Operational definitions prevent silent interpretation changes.",
        items: [
          {
            label: "Delay",
            detail: "Time until the next recorded action.",
          },
          {
            label: "Completeness",
            detail: "Presence of required context fields.",
          },
          {
            label: "Agreement",
            detail: "Consistency between independent coders.",
          },
          {
            label: "Missingness",
            detail: "Reasons a record cannot be analyzed.",
          },
        ],
      },
      {
        layout: "timeline",
        title: "Write the decision rules in advance.",
        body: "Keep departures visible rather than rewriting the original plan.",
        items: [
          {
            label: "Pilot",
            detail: "Test feasibility and refine definitions.",
          },
          {
            label: "Freeze",
            detail: "Record the analysis-ready protocol.",
          },
          {
            label: "Report",
            detail: "Explain deviations and sensitivity checks.",
          },
        ],
      },
      {
        layout: "cta",
        title: "Invite a reproducibility review.",
        body: "Ask a colleague to walk through the procedure without extra explanation.",
        items: [
          {
            label: "Materials",
            detail: "Share forms, definitions and code.",
          },
          {
            label: "Decisions",
            detail: "Document exclusions and thresholds.",
          },
          {
            label: "Version",
            detail: "Identify the exact protocol used.",
          },
        ],
      },
    ],
  },
  {
    id: "conference-paper",
    name: "Conference Paper",
    domain: "Research conference presentation",
    category: "research",
    description:
      "Present a paper as a focused argument with one result, its interpretation and its limits.",
    palette: ["#131B29", "#F2F5FA", "#8CBADF", "#ADAAE0"],
    font: "Arial",
    slides: [
      {
        layout: "cover",
        title: "One finding. A new question.",
        body: "Present a paper as a focused argument with one result, its interpretation and its limits.",
        label: "Research conference presentation",
      },
      {
        layout: "statement",
        title: "The handoff is part of the work.",
        body: "Coordination can fail even when each person completes their own task.",
        items: [],
      },
      {
        layout: "process",
        title: "Observe the transition, not only the outcome.",
        body: "A fictional study combines event records with short follow-up interviews.",
        items: [
          {
            label: "Sample",
            detail: "Select a bounded set of team tasks.",
          },
          {
            label: "Code",
            detail: "Identify context available at handoff.",
          },
          {
            label: "Compare",
            detail: "Examine delay across documented conditions.",
          },
        ],
      },
      {
        layout: "chart",
        title: "Clearer handoffs coincided with shorter delays.",
        body: "Illustrative median delay in hours. Association alone does not establish causation.",
        chart: {
          kind: "bar",
          categories: ["Limited context", "Partial context", "Clear context"],
          series: [
            {
              name: "Delay (sample hours)",
              values: [9, 6, 3],
            },
          ],
          showLegend: true,
          showValues: false,
        },
      },
      {
        layout: "matrix",
        title: "What the result does and does not show.",
        body: "Keep the contribution proportional to the evidence.",
        items: [
          {
            label: "Contribution",
            detail: "Context is a useful unit of analysis.",
          },
          {
            label: "Alternative",
            detail: "Task complexity may explain some delay.",
          },
          {
            label: "Boundary",
            detail: "One setting and a small sample.",
          },
          {
            label: "Next study",
            detail: "Test a controlled change in handoff format.",
          },
        ],
      },
      {
        layout: "cta",
        title: "What would change your interpretation?",
        body: "Use the discussion to identify the strongest alternative explanation.",
        items: [
          {
            label: "Read",
            detail: "Add the paper citation or DOI.",
          },
          {
            label: "Inspect",
            detail: "Link the available materials.",
          },
          {
            label: "Discuss",
            detail: "Invite a focused methodological question.",
          },
        ],
      },
    ],
  },
  {
    id: "poster-pitch",
    name: "Poster Pitch",
    domain: "Research poster conversation",
    category: "research",
    description:
      "Turn a research poster into a short spoken walkthrough that invites a useful conversation.",
    palette: ["#F5F1FA", "#302A47", "#7154A5", "#B583A6"],
    font: "Arial",
    slides: [
      {
        layout: "cover",
        title: "The story in three minutes.",
        body: "Turn a research poster into a short spoken walkthrough that invites a useful conversation.",
        label: "Research poster conversation",
      },
      {
        layout: "statement",
        title: "Start with the puzzle.",
        body: "Why do similar teams experience very different delays when passing work along?",
        items: [],
      },
      {
        layout: "split",
        title: "Show the essential method.",
        body: "A fictional pilot compared task records with participants’ descriptions of the same handoff.",
        items: [
          {
            label: "Records",
            detail: "What happened and when.",
          },
          {
            label: "Accounts",
            detail: "What people believed was available.",
          },
        ],
      },
      {
        layout: "chart",
        title: "The largest gap appeared at the first handoff.",
        body: "Illustrative median waiting time by stage, in hours.",
        chart: {
          kind: "bar",
          categories: ["First handoff", "Review", "Completion"],
          series: [
            {
              name: "Waiting time (sample hours)",
              values: [7, 3, 2],
            },
          ],
          showLegend: true,
          showValues: false,
        },
      },
      {
        layout: "cards",
        title: "Give the listener three anchors.",
        body: "Use these as conversation prompts, not a script to read.",
        items: [
          {
            label: "Finding",
            detail: "The first transition deserves attention.",
          },
          {
            label: "Caveat",
            detail: "The sample cannot explain every team.",
          },
          {
            label: "Question",
            detail: "Which context would be most useful to add?",
          },
        ],
      },
      {
        layout: "cta",
        title: "Let the conversation shape the next study.",
        body: "Pause and invite the listener’s experience or critique.",
        items: [
          {
            label: "Point",
            detail: "Show the result on the poster.",
          },
          {
            label: "Ask",
            detail: "Invite a question about the method.",
          },
          {
            label: "Connect",
            detail: "Offer a paper or contact link.",
          },
        ],
      },
    ],
  },
  {
    id: "replication-report",
    name: "Replication Report",
    domain: "Replication study readout",
    category: "research",
    description:
      "Compare an original claim with a replication, including protocol differences and uncertainty.",
    palette: ["#EDF4EF", "#203C33", "#3F795F", "#A1AF77"],
    font: "Arial",
    slides: [
      {
        layout: "cover",
        title: "Test it again.",
        body: "Compare an original claim with a replication, including protocol differences and uncertainty.",
        label: "Replication study readout",
      },
      {
        layout: "cards",
        title: "Separate the claim from the implementation.",
        body: "Describe the original study with complete citations.",
        items: [
          {
            label: "Claim",
            detail: "A structured prompt improves recall.",
          },
          {
            label: "Measure",
            detail: "Items recalled after a fixed interval.",
          },
          {
            label: "Scope",
            detail: "A defined participant group and setting.",
          },
        ],
      },
      {
        layout: "compare",
        title: "Make protocol differences explicit.",
        body: "A comparison is only useful when important differences are visible.",
        items: [
          {
            label: "Original",
            detail: "A supervised session in one location.",
          },
          {
            label: "Replication",
            detail: "The same task in a remote session.",
          },
          {
            label: "Difference",
            detail: "Device and environment were less controlled.",
          },
        ],
      },
      {
        layout: "chart",
        title: "The direction was similar; the size differed.",
        body: "Fictional mean improvement in recalled items. Add uncertainty estimates for real results.",
        chart: {
          kind: "column",
          categories: ["Original", "Replication"],
          series: [
            {
              name: "Improvement (sample items)",
              values: [3.2, 1.8],
            },
          ],
          showLegend: true,
          showValues: false,
        },
      },
      {
        layout: "matrix",
        title: "Interpret the evidence without a binary label.",
        body: "Evaluate precision, design differences and plausible explanations.",
        items: [
          {
            label: "Direction",
            detail: "Both estimates were positive.",
          },
          {
            label: "Precision",
            detail: "Sample size limits the conclusion.",
          },
          {
            label: "Context",
            detail: "Remote conditions may matter.",
          },
          {
            label: "Next step",
            detail: "Test the contextual difference directly.",
          },
        ],
      },
      {
        layout: "cta",
        title: "Make comparison easier for the next team.",
        body: "Share the materials and decisions needed to repeat the work.",
        items: [
          {
            label: "Archive",
            detail: "Provide the protocol and analysis.",
          },
          {
            label: "Explain",
            detail: "Document every material deviation.",
          },
          {
            label: "Compare",
            detail: "Use the same outcome definition.",
          },
        ],
      },
    ],
  },
  {
    id: "fieldwork-journal",
    name: "Fieldwork Journal",
    domain: "Qualitative fieldwork update",
    category: "research",
    description:
      "Share field observations, emerging interpretations and reflexive questions during qualitative research.",
    palette: ["#F7F3EB", "#303B34", "#6C805D", "#C4A776"],
    font: "Georgia",
    slides: [
      {
        layout: "cover",
        title: "Notice what changes.",
        body: "Share field observations, emerging interpretations and reflexive questions during qualitative research.",
        label: "Qualitative fieldwork update",
      },
      {
        layout: "split",
        title: "Begin with the setting and your role.",
        body: "This fictional fieldwork follows how a community workshop shares practical knowledge.",
        items: [
          {
            label: "Setting",
            detail: "A small recurring group activity.",
          },
          {
            label: "Position",
            detail: "An observer participating in selected tasks.",
          },
        ],
      },
      {
        layout: "quote",
        title: "A small moment can reveal a larger pattern.",
        body: "Watch the first attempt. The explanation comes after.",
        items: [
          {
            label: "Illustrative field note",
            detail: "A fictional observation, not a participant quotation.",
          },
        ],
      },
      {
        layout: "matrix",
        title: "Keep observations distinct from interpretations.",
        body: "Use examples and counterexamples to develop a tentative account.",
        items: [
          {
            label: "Observed",
            detail: "Experienced members demonstrate before explaining.",
          },
          {
            label: "Interpretation",
            detail: "Shared action may establish a common reference.",
          },
          {
            label: "Counterexample",
            detail: "Newcomers sometimes ask for instructions first.",
          },
          {
            label: "Reflexivity",
            detail: "The observer’s presence may change the sequence.",
          },
        ],
      },
      {
        layout: "timeline",
        title: "Let the next visit test the emerging idea.",
        body: "Choose observations that could challenge the interpretation.",
        items: [
          {
            label: "Return",
            detail: "Observe a different group session.",
          },
          {
            label: "Compare",
            detail: "Look for the opposite sequence.",
          },
          {
            label: "Discuss",
            detail: "Seek appropriate participant feedback.",
          },
        ],
      },
      {
        layout: "cta",
        title: "Bring an interpretation you can revise.",
        body: "End with a specific question for the research team.",
        items: [
          {
            label: "Evidence",
            detail: "Show the note behind the claim.",
          },
          {
            label: "Position",
            detail: "Explain your role in the scene.",
          },
          {
            label: "Question",
            detail: "Name what you need to observe next.",
          },
        ],
      },
    ],
  },
  {
    id: "grant-case",
    name: "Grant Case",
    domain: "Research funding proposal",
    category: "research",
    description:
      "Explain why a research project matters, how it will work and what the requested support enables.",
    palette: ["#EDF4EF", "#203C33", "#3F795F", "#A1AF77"],
    font: "Georgia",
    slides: [
      {
        layout: "cover",
        title: "A focused contribution.",
        body: "Explain why a research project matters, how it will work and what the requested support enables.",
        label: "Research funding proposal",
      },
      {
        layout: "statement",
        title: "A useful decision needs better evidence.",
        body: "This fictional project studies how local groups maintain shared environmental records.",
        items: [],
      },
      {
        layout: "cards",
        title: "Three aims, one coherent contribution.",
        body: "Each aim produces a result the next aim can use.",
        items: [
          {
            label: "Describe",
            detail: "Map current recording practices.",
          },
          {
            label: "Explain",
            detail: "Identify barriers to consistent use.",
          },
          {
            label: "Evaluate",
            detail: "Test a small improvement with participants.",
          },
        ],
      },
      {
        layout: "timeline",
        title: "A work plan with decision points.",
        body: "A staged design keeps the scope feasible.",
        items: [
          {
            label: "Months 1–3",
            detail: "Agree access, protocol and pilot.",
          },
          {
            label: "Months 4–8",
            detail: "Collect and analyze the core evidence.",
          },
          {
            label: "Months 9–12",
            detail: "Evaluate and share the findings.",
          },
        ],
      },
      {
        layout: "chart",
        title: "Resources follow the work plan.",
        body: "Illustrative allocation of the requested budget; replace with justified costs.",
        chart: {
          kind: "doughnut",
          categories: ["People", "Fieldwork", "Analysis", "Sharing"],
          series: [
            {
              name: "Budget share (sample %)",
              values: [50, 25, 15, 10],
            },
          ],
          showLegend: true,
          showValues: false,
        },
      },
      {
        layout: "cta",
        title: "Fund the evidence needed for the next decision.",
        body: "Connect the requested support to a specific, achievable contribution.",
        items: [
          {
            label: "Value",
            detail: "State who can use the findings.",
          },
          {
            label: "Feasibility",
            detail: "Show access and relevant capability.",
          },
          {
            label: "Accountability",
            detail: "Define deliverables and review points.",
          },
        ],
      },
    ],
  },
  {
    id: "tech-lightning",
    name: "Tech Lightning",
    domain: "Technical lightning talk",
    category: "technology",
    description:
      "Deliver a short technical talk with a sharp problem, one example and a memorable takeaway.",
    palette: ["#171826", "#F1EFF8", "#AD97F5", "#61C4C6"],
    font: "Arial",
    slides: [
      {
        layout: "cover",
        title: "One idea. Five minutes.",
        body: "Deliver a short technical talk with a sharp problem, one example and a memorable takeaway.",
        label: "Technical lightning talk",
      },
      {
        layout: "statement",
        title: "A retry can repeat more than a request.",
        body: "If an operation has a side effect, repeating it can change the result twice.",
        items: [],
      },
      {
        layout: "code",
        title: "Give repeated work a stable identity.",
        body: 'request = {\n  operationId: "order-42",\n  action: "reserve"\n}\n\nif alreadyHandled(operationId):\n  return storedResult\n\nreturn handleOnce(request)',
        items: [
          {
            label: "Identity",
            detail: "Reuse the same key for the same intent.",
          },
          {
            label: "Result",
            detail: "Return the recorded outcome.",
          },
        ],
      },
      {
        layout: "compare",
        title: "Think about the failure between steps.",
        body: "The example illustrates a design principle, not a complete implementation.",
        items: [
          {
            label: "Naive retry",
            detail: "A timeout can trigger the action again.",
          },
          {
            label: "Stable operation",
            detail: "The system recognizes repeated intent.",
          },
          {
            label: "Remaining work",
            detail: "Storage and concurrency need a clear contract.",
          },
        ],
      },
      {
        layout: "cards",
        title: "Three questions before adding retries.",
        body: "A small checklist exposes the important assumptions.",
        items: [
          {
            label: "Identity",
            detail: "What counts as the same operation?",
          },
          {
            label: "Lifetime",
            detail: "How long is the result remembered?",
          },
          {
            label: "Concurrency",
            detail: "Who decides which attempt owns the work?",
          },
        ],
      },
      {
        layout: "cta",
        title: "Make retries part of the contract.",
        body: "The takeaway: repeat the intent without repeating the effect.",
        items: [
          {
            label: "Inspect",
            detail: "Find one retried operation.",
          },
          {
            label: "Define",
            detail: "Write down its identity rule.",
          },
          {
            label: "Test",
            detail: "Simulate a timeout after success.",
          },
        ],
      },
    ],
  },
  {
    id: "architecture-deep-dive",
    name: "Architecture Deep Dive",
    domain: "Software architecture talk",
    category: "technology",
    description:
      "Explain a system through its responsibilities, data flow, tradeoffs and failure paths.",
    palette: ["#131B29", "#F2F5FA", "#8CBADF", "#ADAAE0"],
    font: "Arial",
    slides: [
      {
        layout: "cover",
        title: "Follow the boundaries.",
        body: "Explain a system through its responsibilities, data flow, tradeoffs and failure paths.",
        label: "Software architecture talk",
      },
      {
        layout: "statement",
        title: "A boundary should clarify ownership.",
        body: "A document system becomes easier to reason about when authoring and file conversion have separate contracts.",
        items: [],
      },
      {
        layout: "process",
        title: "Follow one request through the system.",
        body: "Use an example before presenting the full architecture.",
        items: [
          {
            label: "Author",
            detail: "Accept a structured document change.",
          },
          {
            label: "Compile",
            detail: "Resolve layout into a scene.",
          },
          {
            label: "Export",
            detail: "Encode the scene into a file format.",
          },
        ],
      },
      {
        layout: "matrix",
        title: "Make each boundary explicit.",
        body: "Define what crosses the boundary and what stays inside.",
        items: [
          {
            label: "Input",
            detail: "Validated data with stable identities.",
          },
          {
            label: "Output",
            detail: "A versioned result with diagnostics.",
          },
          {
            label: "State",
            detail: "One owner for each mutable resource.",
          },
          {
            label: "Failure",
            detail: "Typed errors with useful context.",
          },
        ],
      },
      {
        layout: "compare",
        title: "Every separation has a cost.",
        body: "Explain the tradeoff that led to this design.",
        items: [
          {
            label: "One module",
            detail: "Fewer interfaces, more coupled assumptions.",
          },
          {
            label: "Explicit layers",
            detail: "Independent contracts and focused tests.",
          },
          {
            label: "Cost",
            detail: "More translation and versioning work.",
          },
        ],
      },
      {
        layout: "cta",
        title: "Test the boundary, not just the happy path.",
        body: "Choose a failure that crosses two responsibilities.",
        items: [
          {
            label: "Trace",
            detail: "Walk through one concrete request.",
          },
          {
            label: "Challenge",
            detail: "Find an ambiguous ownership rule.",
          },
          {
            label: "Verify",
            detail: "Test the contract at the boundary.",
          },
        ],
      },
    ],
  },
  {
    id: "live-demo",
    name: "Live Demo",
    domain: "Technical product demonstration",
    category: "technology",
    description:
      "Structure a reliable live demo around one task, visible results and a prepared recovery path.",
    palette: ["#F3F6FC", "#192D4B", "#356CB6", "#7DA7BB"],
    font: "Arial",
    slides: [
      {
        layout: "cover",
        title: "Show the working thing.",
        body: "Structure a reliable live demo around one task, visible results and a prepared recovery path.",
        label: "Technical product demonstration",
      },
      {
        layout: "cards",
        title: "Tell the audience what to watch.",
        body: "A fictional tool turns structured content into an editable slide.",
        items: [
          {
            label: "Input",
            detail: "A short document with one chart.",
          },
          {
            label: "Action",
            detail: "Change the data and regenerate.",
          },
          {
            label: "Result",
            detail: "The chart stays editable in the export.",
          },
        ],
      },
      {
        layout: "code",
        title: "Keep the first example small.",
        body: 'const deck = createExample();\n\ndeck.updateChart({\n  categories: ["A", "B"],\n  values: [12, 19]\n});\n\nconst file = deck.export();',
        items: [
          {
            label: "Illustration",
            detail: "Pseudocode for the demo narrative.",
          },
          {
            label: "Focus",
            detail: "One change and one visible result.",
          },
        ],
      },
      {
        layout: "process",
        title: "Show the complete round trip.",
        body: "Avoid switching between unrelated features.",
        items: [
          {
            label: "Create",
            detail: "Open the prepared starting document.",
          },
          {
            label: "Edit",
            detail: "Change one meaningful value.",
          },
          {
            label: "Verify",
            detail: "Open the exported result and inspect it.",
          },
        ],
      },
      {
        layout: "matrix",
        title: "Prepare a recovery path before going live.",
        body: "Make the fallback useful to the audience.",
        items: [
          {
            label: "Network",
            detail: "Keep a local sample ready.",
          },
          {
            label: "Timing",
            detail: "Know which optional step to skip.",
          },
          {
            label: "Failure",
            detail: "Explain the expected result calmly.",
          },
          {
            label: "Fallback",
            detail: "Use a short recording of the same task.",
          },
        ],
      },
      {
        layout: "cta",
        title: "Let the audience try the same task.",
        body: "Share a reproducible starting point and one next challenge.",
        items: [
          {
            label: "Start",
            detail: "Link the sample and instructions.",
          },
          {
            label: "Change",
            detail: "Suggest a small variation.",
          },
          {
            label: "Report",
            detail: "Provide a place for useful feedback.",
          },
        ],
      },
    ],
  },
  {
    id: "open-source-story",
    name: "Open Source Story",
    domain: "Open source project talk",
    category: "technology",
    description:
      "Introduce an open source project through its purpose, design and approachable contribution path.",
    palette: ["#EDF4EF", "#203C33", "#3F795F", "#A1AF77"],
    font: "Arial",
    slides: [
      {
        layout: "cover",
        title: "Build it. Share the craft.",
        body: "Introduce an open source project through its purpose, design and approachable contribution path.",
        label: "Open source project talk",
      },
      {
        layout: "statement",
        title: "Start with the problem that kept returning.",
        body: "A fictional project makes structured presentation content easier to inspect and transform.",
        items: [],
      },
      {
        layout: "cards",
        title: "A small core with a clear purpose.",
        body: "Explain what belongs in the project and what does not.",
        items: [
          {
            label: "Model",
            detail: "Readable, versioned document data.",
          },
          {
            label: "Engine",
            detail: "Deterministic transformations and diagnostics.",
          },
          {
            label: "Adapters",
            detail: "Optional rendering and file integrations.",
          },
        ],
      },
      {
        layout: "process",
        title: "A first contribution should be legible.",
        body: "Show a realistic path from issue to reviewed change.",
        items: [
          {
            label: "Reproduce",
            detail: "Run a focused example.",
          },
          {
            label: "Change",
            detail: "Make one bounded improvement.",
          },
          {
            label: "Explain",
            detail: "Document the behavior and validation.",
          },
        ],
      },
      {
        layout: "matrix",
        title: "Community practices are part of the product.",
        body: "Make the expectations visible to new contributors.",
        items: [
          {
            label: "Scope",
            detail: "Maintain a clear support boundary.",
          },
          {
            label: "Review",
            detail: "Explain decisions with concrete evidence.",
          },
          {
            label: "Access",
            detail: "Offer useful tasks at different experience levels.",
          },
          {
            label: "Maintenance",
            detail: "Prefer changes the team can sustain.",
          },
        ],
      },
      {
        layout: "cta",
        title: "Make your first useful change.",
        body: "Invite a contribution that does not require knowing the whole codebase.",
        items: [
          {
            label: "Try",
            detail: "Run the smallest example.",
          },
          {
            label: "Notice",
            detail: "Describe one confusing step.",
          },
          {
            label: "Contribute",
            detail: "Improve the example or its explanation.",
          },
        ],
      },
    ],
  },
  {
    id: "performance-lab",
    name: "Performance Lab",
    domain: "Software performance investigation",
    category: "technology",
    description:
      "Present a performance investigation with a workload, baseline, experiment and tradeoffs.",
    palette: ["#171826", "#F1EFF8", "#AD97F5", "#61C4C6"],
    font: "Arial",
    slides: [
      {
        layout: "cover",
        title: "Measure before guessing.",
        body: "Present a performance investigation with a workload, baseline, experiment and tradeoffs.",
        label: "Software performance investigation",
      },
      {
        layout: "cards",
        title: "Define the workload before the result.",
        body: "A fictional benchmark measures repeated document compilation.",
        items: [
          {
            label: "Input",
            detail: "The same document and asset set.",
          },
          {
            label: "Environment",
            detail: "A fixed runtime and machine profile.",
          },
          {
            label: "Metric",
            detail: "Median duration over repeated runs.",
          },
        ],
      },
      {
        layout: "chart",
        title: "The largest cost appeared before rendering.",
        body: "Illustrative stage durations in milliseconds; profile your own workload.",
        chart: {
          kind: "bar",
          categories: ["Parse", "Layout", "Render", "Export"],
          series: [
            {
              name: "Duration (sample ms)",
              values: [18, 82, 24, 31],
            },
          ],
          showLegend: true,
          showValues: false,
        },
      },
      {
        layout: "compare",
        title: "Change one expensive assumption.",
        body: "The experiment reuses a stable intermediate result.",
        items: [
          {
            label: "Baseline",
            detail: "Recompute every unchanged component.",
          },
          {
            label: "Experiment",
            detail: "Reuse validated unchanged work.",
          },
          {
            label: "Tradeoff",
            detail: "Track invalidation and memory cost.",
          },
        ],
      },
      {
        layout: "chart",
        title: "A faster median is only part of the result.",
        body: "Fictional median duration before and after the experiment.",
        chart: {
          kind: "column",
          categories: ["Baseline", "Experiment"],
          series: [
            {
              name: "Duration (sample ms)",
              values: [155, 109],
            },
          ],
          showLegend: true,
          showValues: false,
        },
      },
      {
        layout: "cta",
        title: "Keep the benchmark close to the claim.",
        body: "Report the workload, environment and limits with the result.",
        items: [
          {
            label: "Repeat",
            detail: "Check variance and tail behavior.",
          },
          {
            label: "Inspect",
            detail: "Measure memory and correctness.",
          },
          {
            label: "Share",
            detail: "Include the reproducible benchmark.",
          },
        ],
      },
    ],
  },
  {
    id: "incident-learning",
    name: "Incident Learning",
    domain: "Technical incident review",
    category: "technology",
    description:
      "Explain an incident through impact, timeline, contributing conditions and verifiable actions.",
    palette: ["#F3F6FC", "#192D4B", "#356CB6", "#7DA7BB"],
    font: "Arial",
    slides: [
      {
        layout: "cover",
        title: "Understand. Improve.",
        body: "Explain an incident through impact, timeline, contributing conditions and verifiable actions.",
        label: "Technical incident review",
      },
      {
        layout: "metrics",
        title: "Start with the user impact.",
        body: "Fictional incident figures; replace with verified observations.",
        items: [
          {
            label: "Duration",
            detail: "Time until service recovery.",
            metric: "24m",
          },
          {
            label: "Affected jobs",
            detail: "Jobs requiring a retry.",
            metric: "180",
          },
          {
            label: "Data loss",
            detail: "No loss found in the reviewed sample.",
            metric: "0",
          },
        ],
      },
      {
        layout: "timeline",
        title: "Reconstruct the sequence from evidence.",
        body: "Use timestamps from a consistent clock.",
        items: [
          {
            label: "Detect",
            detail: "An alert showed growing queue delay.",
          },
          {
            label: "Mitigate",
            detail: "Pause new work and restore capacity.",
          },
          {
            label: "Recover",
            detail: "Drain the backlog and verify outcomes.",
          },
        ],
      },
      {
        layout: "matrix",
        title: "Look for contributing conditions.",
        body: "Explain how the system allowed the failure to grow.",
        items: [
          {
            label: "Trigger",
            detail: "A burst exceeded the assumed workload.",
          },
          {
            label: "Capacity",
            detail: "Workers had a fixed concurrency limit.",
          },
          {
            label: "Signal",
            detail: "The alert fired after delay accumulated.",
          },
          {
            label: "Recovery",
            detail: "Manual steps extended the response.",
          },
        ],
      },
      {
        layout: "cards",
        title: "Choose actions with a verification method.",
        body: "A useful action changes a condition, not a person’s attentiveness.",
        items: [
          {
            label: "Bound",
            detail: "Test admission limits under a burst.",
          },
          {
            label: "Detect",
            detail: "Alert on the earlier queue signal.",
          },
          {
            label: "Recover",
            detail: "Exercise an automated drain procedure.",
          },
        ],
      },
      {
        layout: "cta",
        title: "Close the loop with evidence.",
        body: "An action is complete when its intended behavior has been demonstrated.",
        items: [
          {
            label: "Own",
            detail: "Assign a responsible team.",
          },
          {
            label: "Date",
            detail: "Set a realistic review point.",
          },
          {
            label: "Verify",
            detail: "Record the test or drill result.",
          },
        ],
      },
    ],
  },
  {
    id: "api-workshop",
    name: "API Workshop",
    domain: "Hands-on developer workshop",
    category: "technology",
    description:
      "Guide a hands-on session from a minimal API call to validation, errors and a working extension.",
    palette: ["#F5F1FA", "#302A47", "#7154A5", "#B583A6"],
    font: "Arial",
    slides: [
      {
        layout: "cover",
        title: "Learn by building.",
        body: "Guide a hands-on session from a minimal API call to validation, errors and a working extension.",
        label: "Hands-on developer workshop",
      },
      {
        layout: "agenda",
        title: "Build one complete workflow.",
        body: "Use a prepared environment so the session starts with the API.",
        items: [
          {
            label: "Start",
            detail: "Run the smallest successful request.",
            metric: "10 min",
          },
          {
            label: "Explore",
            detail: "Change the input and handle an error.",
            metric: "20 min",
          },
          {
            label: "Extend",
            detail: "Build a small variation with a partner.",
            metric: "15 min",
          },
        ],
      },
      {
        layout: "code",
        title: "Make the contract visible.",
        body: 'const result = await client.run({\n  input: example,\n  mode: "preview"\n});\n\nif (!result.ok) {\n  showError(result.error);\n}',
        items: [
          {
            label: "Illustration",
            detail: "Pseudocode for a typed result contract.",
          },
          {
            label: "Exercise",
            detail: "Identify the success and error shapes.",
          },
        ],
      },
      {
        layout: "matrix",
        title: "Practice the cases that change behavior.",
        body: "Each pair explains one case to the group.",
        items: [
          {
            label: "Valid input",
            detail: "Inspect the returned result.",
          },
          {
            label: "Missing field",
            detail: "Read the validation feedback.",
          },
          {
            label: "Unavailable service",
            detail: "Choose a bounded recovery path.",
          },
          {
            label: "Repeated request",
            detail: "Understand the operation identity.",
          },
        ],
      },
      {
        layout: "process",
        title: "Extend the example without losing the contract.",
        body: "Keep the new behavior small enough to finish.",
        items: [
          {
            label: "Choose",
            detail: "Pick one useful input variation.",
          },
          {
            label: "Build",
            detail: "Handle success and failure explicitly.",
          },
          {
            label: "Explain",
            detail: "Demonstrate the result to a partner.",
          },
        ],
      },
      {
        layout: "cta",
        title: "Leave with a working example.",
        body: "Share the sample, reference docs and one next exercise.",
        items: [
          {
            label: "Save",
            detail: "Keep the completed example.",
          },
          {
            label: "Review",
            detail: "Write down the contract in plain words.",
          },
          {
            label: "Continue",
            detail: "Try the extension after the session.",
          },
        ],
      },
    ],
  },
  {
    id: "migration-journey",
    name: "Migration Journey",
    domain: "Technical migration case study",
    category: "technology",
    description:
      "Explain a migration through its constraints, staged rollout, verification and rollback decisions.",
    palette: ["#131B29", "#F2F5FA", "#8CBADF", "#ADAAE0"],
    font: "Arial",
    slides: [
      {
        layout: "cover",
        title: "Move with a clear plan.",
        body: "Explain a migration through its constraints, staged rollout, verification and rollback decisions.",
        label: "Technical migration case study",
      },
      {
        layout: "split",
        title: "Name the constraint that made change necessary.",
        body: "A fictional service needs a new storage model without interrupting existing clients.",
        items: [
          {
            label: "Compatibility",
            detail: "Current clients must keep working.",
          },
          {
            label: "Confidence",
            detail: "Compare behavior before switching traffic.",
          },
        ],
      },
      {
        layout: "timeline",
        title: "Make each stage independently useful.",
        body: "Avoid a single irreversible cutover.",
        items: [
          {
            label: "Prepare",
            detail: "Add a compatible interface and observability.",
          },
          {
            label: "Compare",
            detail: "Run bounded checks against both paths.",
          },
          {
            label: "Switch",
            detail: "Move traffic in controlled increments.",
          },
        ],
      },
      {
        layout: "chart",
        title: "Increase exposure after each verified checkpoint.",
        body: "Illustrative rollout shares, not a universal deployment schedule.",
        chart: {
          kind: "line",
          categories: ["Pilot", "Small cohort", "Expanded", "Complete"],
          series: [
            {
              name: "Traffic share (sample %)",
              values: [5, 20, 60, 100],
            },
          ],
          showLegend: true,
          showValues: false,
        },
      },
      {
        layout: "matrix",
        title: "Decide the stop conditions in advance.",
        body: "Use measurable signals and a rehearsed recovery path.",
        items: [
          {
            label: "Correctness",
            detail: "Unexpected output differences.",
          },
          {
            label: "Latency",
            detail: "A sustained regression against the baseline.",
          },
          {
            label: "Capacity",
            detail: "Resource use outside the agreed budget.",
          },
          {
            label: "Rollback",
            detail: "A tested route to the previous behavior.",
          },
        ],
      },
      {
        layout: "cta",
        title: "Finish the migration by removing uncertainty.",
        body: "Complete the operational work after the traffic switch.",
        items: [
          {
            label: "Verify",
            detail: "Check the final cohort and data state.",
          },
          {
            label: "Retire",
            detail: "Remove the old path deliberately.",
          },
          {
            label: "Document",
            detail: "Record the decisions and lessons.",
          },
        ],
      },
    ],
  },
  {
    id: "positioning-story",
    name: "Positioning Story",
    domain: "Product positioning strategy",
    category: "marketing",
    description:
      "Define the audience, alternatives, distinctive value and proof behind a positioning choice.",
    palette: ["#FFF4E5", "#4C332B", "#B96548", "#6E8F80"],
    font: "Arial",
    slides: [
      {
        layout: "cover",
        title: "A place in their mind.",
        body: "Define the audience, alternatives, distinctive value and proof behind a positioning choice.",
        label: "Product positioning strategy",
      },
      {
        layout: "statement",
        title: "Positioning begins with an audience choice.",
        body: "A fictional product helps small creative teams turn scattered feedback into a clear next action.",
        items: [],
      },
      {
        layout: "compare",
        title: "Understand the alternatives people already use.",
        body: "Compare the job being done, not just product features.",
        items: [
          {
            label: "Workaround",
            detail: "Messages and documents spread across tools.",
          },
          {
            label: "Chosen position",
            detail: "One shared place for actionable feedback.",
          },
          {
            label: "Alternative",
            detail: "A broad project system with more setup.",
          },
        ],
      },
      {
        layout: "cards",
        title: "Connect the promise to credible proof.",
        body: "Replace the examples with verified product evidence.",
        items: [
          {
            label: "Value",
            detail: "Less effort reconstructing decisions.",
          },
          {
            label: "Difference",
            detail: "Feedback stays attached to the work.",
          },
          {
            label: "Proof",
            detail: "A clear before-and-after task demonstration.",
          },
        ],
      },
      {
        layout: "matrix",
        title: "Test the message before scaling it.",
        body: "Use questions that reveal comprehension and relevance.",
        items: [
          {
            label: "Audience",
            detail: "Who recognizes the problem?",
          },
          {
            label: "Meaning",
            detail: "What do they think the product does?",
          },
          {
            label: "Difference",
            detail: "What seems distinct from alternatives?",
          },
          {
            label: "Credibility",
            detail: "Which claim needs stronger evidence?",
          },
        ],
      },
      {
        layout: "cta",
        title: "Choose one position to test.",
        body: "A clear hypothesis is more useful than a list of possible messages.",
        items: [
          {
            label: "Write",
            detail: "State audience, value and difference.",
          },
          {
            label: "Test",
            detail: "Use one consistent research task.",
          },
          {
            label: "Refine",
            detail: "Change the weakest part of the claim.",
          },
        ],
      },
    ],
  },
  {
    id: "audience-insights",
    name: "Audience Insights",
    domain: "Marketing audience research",
    category: "marketing",
    description:
      "Turn audience research into useful segments, motivations and messaging hypotheses.",
    palette: ["#F7F3EB", "#303B34", "#6C805D", "#C4A776"],
    font: "Georgia",
    slides: [
      {
        layout: "cover",
        title: "Know who you are for.",
        body: "Turn audience research into useful segments, motivations and messaging hypotheses.",
        label: "Marketing audience research",
      },
      {
        layout: "quote",
        title: "Listen for the job behind the request.",
        body: "I do not need more options. I need to know which one fits my day.",
        items: [
          {
            label: "Illustrative interview composite",
            detail: "Fictional language for a research example.",
          },
        ],
      },
      {
        layout: "cards",
        title: "Group people by a meaningful difference.",
        body: "These example segments reflect needs rather than demographics.",
        items: [
          {
            label: "Get started",
            detail: "Needs confidence in the first choice.",
          },
          {
            label: "Keep moving",
            detail: "Values speed and a familiar path.",
          },
          {
            label: "Go deeper",
            detail: "Wants control and detailed explanation.",
          },
        ],
      },
      {
        layout: "chart",
        title: "The most common barrier was uncertainty.",
        body: "Illustrative coded interview mentions; one person may mention several barriers.",
        chart: {
          kind: "bar",
          categories: [
            "Uncertainty",
            "Setup effort",
            "Price",
            "Missing detail",
          ],
          series: [
            {
              name: "Mentions (sample)",
              values: [18, 13, 9, 7],
            },
          ],
          showLegend: true,
          showValues: false,
        },
      },
      {
        layout: "matrix",
        title: "Translate insight into a testable response.",
        body: "Keep the evidence and the marketing hypothesis separate.",
        items: [
          {
            label: "Observation",
            detail: "People hesitate at the first choice.",
          },
          {
            label: "Hypothesis",
            detail: "A clear example may reduce uncertainty.",
          },
          {
            label: "Message",
            detail: "Show what a good first step looks like.",
          },
          {
            label: "Test",
            detail: "Compare comprehension before conversion.",
          },
        ],
      },
      {
        layout: "cta",
        title: "Make the next campaign more specific.",
        body: "Choose one audience need and one message to test.",
        items: [
          {
            label: "Focus",
            detail: "Name the need the campaign addresses.",
          },
          {
            label: "Evidence",
            detail: "Attach the research behind it.",
          },
          {
            label: "Learn",
            detail: "Define what would change your mind.",
          },
        ],
      },
    ],
  },
  {
    id: "content-calendar",
    name: "Content Calendar",
    domain: "Editorial content planning",
    category: "marketing",
    description:
      "Plan a coherent editorial series with audience needs, formats, distribution and learning goals.",
    palette: ["#FBF1F2", "#472E38", "#AC4E71", "#D49C69"],
    font: "Georgia",
    slides: [
      {
        layout: "cover",
        title: "A story with rhythm.",
        body: "Plan a coherent editorial series with audience needs, formats, distribution and learning goals.",
        label: "Editorial content planning",
      },
      {
        layout: "cards",
        title: "Give every piece a useful role.",
        body: "A fictional series helps people make more considered everyday choices.",
        items: [
          {
            label: "Discover",
            detail: "Introduce one surprising observation.",
          },
          {
            label: "Understand",
            detail: "Explain a choice with a concrete example.",
          },
          {
            label: "Apply",
            detail: "Offer a small action worth trying.",
          },
        ],
      },
      {
        layout: "agenda",
        title: "Build a month around one theme.",
        body: "Use a realistic cadence that the team can maintain.",
        items: [
          {
            label: "Week 1",
            detail: "Publish the central story and question.",
            metric: "Discover",
          },
          {
            label: "Week 2",
            detail: "Show the process behind the idea.",
            metric: "Explain",
          },
          {
            label: "Week 3",
            detail: "Invite a practical audience response.",
            metric: "Apply",
          },
        ],
      },
      {
        layout: "portfolio",
        title: "Adapt the story to the format.",
        body: "Keep the central idea recognizable across channels.",
        items: [
          {
            label: "Long form",
            detail: "A complete explanation with examples.",
          },
          {
            label: "Short form",
            detail: "One visual detail and one useful point.",
          },
          {
            label: "Conversation",
            detail: "A prompt that invites lived experience.",
          },
        ],
      },
      {
        layout: "matrix",
        title: "Plan learning as well as publishing.",
        body: "Choose signals that match the job of each piece.",
        items: [
          {
            label: "Attention",
            detail: "Did the intended audience notice?",
          },
          {
            label: "Understanding",
            detail: "Can people explain the idea?",
          },
          {
            label: "Action",
            detail: "Did the proposed next step happen?",
          },
          {
            label: "Reuse",
            detail: "Which material remained useful?",
          },
        ],
      },
      {
        layout: "cta",
        title: "Publish a sustainable first sequence.",
        body: "Start with a complete small series and improve from its response.",
        items: [
          {
            label: "Assign",
            detail: "Name an owner and review date.",
          },
          {
            label: "Prepare",
            detail: "Create the core assets together.",
          },
          {
            label: "Review",
            detail: "Use the same learning questions each week.",
          },
        ],
      },
    ],
  },
  {
    id: "social-experiment",
    name: "Social Experiment",
    domain: "Social campaign experiment",
    category: "marketing",
    description:
      "Frame a social content experiment with a hypothesis, controlled variation and useful interpretation.",
    palette: ["#F5F1FA", "#302A47", "#7154A5", "#B583A6"],
    font: "Arial",
    slides: [
      {
        layout: "cover",
        title: "Test the creative idea.",
        body: "Frame a social content experiment with a hypothesis, controlled variation and useful interpretation.",
        label: "Social campaign experiment",
      },
      {
        layout: "statement",
        title: "Test one reason people might respond.",
        body: "A fictional campaign asks whether showing the process is more useful than showing only the finished object.",
        items: [],
      },
      {
        layout: "compare",
        title: "Change the creative, keep the comparison clear.",
        body: "Use comparable audiences, timing and measurement definitions.",
        items: [
          {
            label: "Version A",
            detail: "A polished image of the finished object.",
          },
          {
            label: "Version B",
            detail: "A short view of how it was made.",
          },
          {
            label: "Control",
            detail: "The same offer and destination.",
          },
        ],
      },
      {
        layout: "chart",
        title: "The process version prompted more saves.",
        body: "Illustrative saves per thousand impressions; check sample size and uncertainty.",
        chart: {
          kind: "column",
          categories: ["Finished object", "Making process"],
          series: [
            {
              name: "Saves per 1,000 (sample)",
              values: [12, 19],
            },
          ],
          showLegend: true,
          showValues: false,
        },
      },
      {
        layout: "matrix",
        title: "A result is a clue, not a universal rule.",
        body: "Identify what the experiment can support.",
        items: [
          {
            label: "Observed",
            detail: "More saves in this comparison.",
          },
          {
            label: "Possible reason",
            detail: "The process offered reusable information.",
          },
          {
            label: "Alternative",
            detail: "Timing or audience mix may differ.",
          },
          {
            label: "Next test",
            detail: "Repeat with another object and matched timing.",
          },
        ],
      },
      {
        layout: "cta",
        title: "Keep the learning, refine the experiment.",
        body: "Record the hypothesis and result before planning the next variation.",
        items: [
          {
            label: "Document",
            detail: "Preserve the creative and settings.",
          },
          {
            label: "Repeat",
            detail: "Test whether the pattern holds.",
          },
          {
            label: "Apply",
            detail: "Use the finding within its limits.",
          },
        ],
      },
    ],
  },
  {
    id: "brand-partnership",
    name: "Brand Partnership",
    domain: "Co-marketing partnership proposal",
    category: "marketing",
    description:
      "Propose a partnership around audience fit, a shared experience and clear responsibilities.",
    palette: ["#FFF4E5", "#4C332B", "#B96548", "#6E8F80"],
    font: "Georgia",
    slides: [
      {
        layout: "cover",
        title: "Better together.",
        body: "Propose a partnership around audience fit, a shared experience and clear responsibilities.",
        label: "Co-marketing partnership proposal",
      },
      {
        layout: "split",
        title: "Start with a shared audience need.",
        body: "A fictional retreat and local creative studio want to offer a more thoughtful weekend experience.",
        items: [
          {
            label: "Shared audience",
            detail: "People seeking a restorative creative break.",
          },
          {
            label: "Shared value",
            detail: "Time, craft and local connection.",
          },
        ],
      },
      {
        layout: "portfolio",
        title: "Create something neither partner offers alone.",
        body: "A small collaborative experience makes the partnership concrete.",
        items: [
          {
            label: "Stay",
            detail: "A calm setting and considered hospitality.",
          },
          {
            label: "Make",
            detail: "A guided hands-on creative session.",
          },
          {
            label: "Take away",
            detail: "A useful object and a story to share.",
          },
        ],
      },
      {
        layout: "matrix",
        title: "Make responsibilities visible early.",
        body: "The proposal should be practical enough to review.",
        items: [
          {
            label: "Experience",
            detail: "Agree the guest journey and capacity.",
          },
          {
            label: "Content",
            detail: "Define asset creation and usage rights.",
          },
          {
            label: "Operations",
            detail: "Assign booking and support ownership.",
          },
          {
            label: "Measurement",
            detail: "Choose shared success criteria.",
          },
        ],
      },
      {
        layout: "timeline",
        title: "Pilot before committing to a larger program.",
        body: "Use a bounded first event to learn together.",
        items: [
          {
            label: "Align",
            detail: "Confirm audience, scope and responsibilities.",
          },
          {
            label: "Deliver",
            detail: "Run one carefully prepared experience.",
          },
          {
            label: "Review",
            detail: "Compare outcomes and decide the next step.",
          },
        ],
      },
      {
        layout: "cta",
        title: "Agree a small, complete pilot.",
        body: "A useful partnership begins with a clear shared commitment.",
        items: [
          {
            label: "Confirm",
            detail: "Name the audience and experience.",
          },
          {
            label: "Define",
            detail: "Set scope, owners and timing.",
          },
          {
            label: "Review",
            detail: "Choose the decision after the pilot.",
          },
        ],
      },
    ],
  },
  {
    id: "campaign-retrospective",
    name: "Campaign Retrospective",
    domain: "Marketing campaign review",
    category: "marketing",
    description:
      "Review a campaign against its objective, channel evidence, creative lessons and next decisions.",
    palette: ["#F3F6FC", "#192D4B", "#356CB6", "#7DA7BB"],
    font: "Arial",
    slides: [
      {
        layout: "cover",
        title: "What worked. What comes next.",
        body: "Review a campaign against its objective, channel evidence, creative lessons and next decisions.",
        label: "Marketing campaign review",
      },
      {
        layout: "metrics",
        title: "Return to the original objective.",
        body: "Fictional campaign figures illustrate how to separate reach from useful action.",
        items: [
          {
            label: "Qualified visits",
            detail: "Visits matching the agreed audience.",
            metric: "8.4k",
          },
          {
            label: "Useful actions",
            detail: "Completed next steps.",
            metric: "620",
          },
          {
            label: "Cost per action",
            detail: "Illustrative blended cost.",
            metric: "$18",
          },
        ],
      },
      {
        layout: "chart",
        title: "Channels played different roles.",
        body: "Illustrative completed actions by channel; attribution rules should be explicit.",
        chart: {
          kind: "bar",
          categories: ["Search", "Email", "Social", "Partners"],
          series: [
            {
              name: "Actions (sample)",
              values: [240, 180, 110, 90],
            },
          ],
          showLegend: true,
          showValues: false,
        },
      },
      {
        layout: "compare",
        title: "Identify the creative lesson behind the result.",
        body: "Use evidence from audience response, not personal preference.",
        items: [
          {
            label: "Initial approach",
            detail: "Broad claims with little concrete detail.",
          },
          {
            label: "Stronger version",
            detail: "One clear use case and visible proof.",
          },
          {
            label: "Open question",
            detail: "Does the pattern hold for new audiences?",
          },
        ],
      },
      {
        layout: "matrix",
        title: "Turn the review into decisions.",
        body: "Each conclusion should change something in the next campaign.",
        items: [
          {
            label: "Keep",
            detail: "The clearest use-case demonstration.",
          },
          {
            label: "Change",
            detail: "The weakest first-step explanation.",
          },
          {
            label: "Stop",
            detail: "A format with no useful audience response.",
          },
          {
            label: "Test",
            detail: "A new audience with the strongest message.",
          },
        ],
      },
      {
        layout: "cta",
        title: "Plan the next campaign around one learning.",
        body: "Choose a specific hypothesis rather than repeating the full plan.",
        items: [
          {
            label: "Focus",
            detail: "Name the audience and desired action.",
          },
          {
            label: "Build",
            detail: "Reuse what the evidence supports.",
          },
          {
            label: "Measure",
            detail: "Keep the comparison interpretable.",
          },
        ],
      },
    ],
  },
];
