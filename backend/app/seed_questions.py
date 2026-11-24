from backend.app.database import SessionLocal
from backend.app.models.models import QuestionBank

COMPREHENSIVE_QUESTIONS = [
    # 1. Aptitude
    {
        "category": "Aptitude",
        "topic": "Quantitative Aptitude",
        "question_type": "mcq",
        "difficulty_level": 1,
        "difficulty_str": "Beginner",
        "question": "A train 120m long passes a pole in 6 seconds. What is the speed of the train in km/hr?",
        "options": ["60 km/hr", "72 km/hr", "80 km/hr", "90 km/hr"],
        "correct_option_index": 1,
        "explanation": "Speed = Distance / Time = 120m / 6s = 20 m/s. 20 * (18/5) = 72 km/hr.",
        "marks": 1,
        "time_limit_sec": 90
    },
    {
        "category": "Aptitude",
        "topic": "Logical Reasoning",
        "question_type": "mcq",
        "difficulty_level": 2,
        "difficulty_str": "Intermediate",
        "question": "If 'ENGINEER' is coded as 'FOJHFFS', how would 'DEVELOPER' be coded using the same Caesar cipher shift?",
        "options": ["EFWFMPQFS", "EFXEMPPER", "EEWELOPER", "EFVFMPOFS"],
        "correct_option_index": 0,
        "explanation": "Each character is shifted forward by +1: D->E, E->F, V->W, E->F, L->M, O->P, P->Q, E->F, R->S.",
        "marks": 1,
        "time_limit_sec": 90
    },
    {
        "category": "Aptitude",
        "topic": "Verbal Ability",
        "question_type": "mcq",
        "difficulty_level": 3,
        "difficulty_str": "Advanced",
        "question": "Identify the word most analogous to: EPHEMERAL : PERMANENT :: TACITURN : ?",
        "options": ["Reticent", "Loquacious", "Voracious", "Meticulous"],
        "correct_option_index": 1,
        "explanation": "Ephemeral is antonymous to Permanent. Taciturn (reserved/uncommunicative) is antonymous to Loquacious (talkative).",
        "marks": 1,
        "time_limit_sec": 90
    },

    # 2. Programming Fundamentals
    {
        "category": "Programming",
        "topic": "Control Flow & Scopes",
        "question_type": "mcq",
        "difficulty_level": 1,
        "difficulty_str": "Beginner",
        "question": "In Python, which of the following expressions evaluates to False in a conditional statement?",
        "options": ["'0'", "[0]", "0", "(-1)"],
        "correct_option_index": 2,
        "explanation": "The integer 0 is falsy, whereas non-empty strings and lists ('0', [0]) evaluate to True.",
        "marks": 1,
        "time_limit_sec": 60
    },
    {
        "category": "Programming",
        "topic": "Object-Oriented Programming",
        "question_type": "mcq",
        "difficulty_level": 2,
        "difficulty_str": "Intermediate",
        "question": "Which OOP principle allows a subclass to provide a specific implementation of a method defined in its superclass?",
        "options": ["Encapsulation", "Method Overriding (Polymorphism)", "Data Abstraction", "Multiple Inheritance"],
        "correct_option_index": 1,
        "explanation": "Method overriding allows a derived class to supply its own dynamic behavior for a method inherited from the parent.",
        "marks": 1,
        "time_limit_sec": 90
    },
    {
        "category": "Programming",
        "topic": "Functions & Algorithms",
        "question_type": "coding",
        "difficulty_level": 3,
        "difficulty_str": "Advanced",
        "question": "Write a Python function `reverse_words(s)` that takes a string of words and returns the string with words reversed in place, separated by a single space.",
        "options": ["Submit Python code in the sandbox editor"],
        "correct_option_index": 0,
        "starter_code": "def reverse_words(s: str) -> str:\n    # Return the string with words in reversed order\n    return ' '.join(s.strip().split()[::-1])\n",
        "test_cases": [
            {"input": "'the sky is blue'", "expected_output": "blue is sky the", "is_hidden": False},
            {"input": "'  hello world  '", "expected_output": "world hello", "is_hidden": False},
            {"input": "'ProofHire Placement AI'", "expected_output": "AI Placement ProofHire", "is_hidden": True}
        ],
        "marks": 2,
        "time_limit_sec": 180,
        "explanation": "Splitting by whitespace strips extraneous spaces; reversing the token array and rejoining produces clean reverse order."
    },

    # 3. Data Structures & Algorithms
    {
        "category": "DSA",
        "topic": "Arrays & HashMaps",
        "question_type": "mcq",
        "difficulty_level": 1,
        "difficulty_str": "Beginner",
        "question": "What is the average time complexity of lookups and insertions in a Hash Table?",
        "options": ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
        "correct_option_index": 0,
        "explanation": "With an effective hash function and low load factor, hash table lookups take amortized O(1) constant time.",
        "marks": 1,
        "time_limit_sec": 60
    },
    {
        "category": "DSA",
        "topic": "Trees & Graphs",
        "question_type": "mcq",
        "difficulty_level": 2,
        "difficulty_str": "Intermediate",
        "question": "In a balanced Binary Search Tree (AVL / Red-Black Tree) with N nodes, what is the worst-case search time complexity?",
        "options": ["O(N)", "O(log N)", "O(1)", "O(N^2)"],
        "correct_option_index": 1,
        "explanation": "Balanced BSTs guarantee maximum tree height of O(log N), keeping search, insertion, and deletion strictly O(log N).",
        "marks": 1,
        "time_limit_sec": 90
    },
    {
        "category": "DSA",
        "topic": "Dynamic Programming",
        "question_type": "coding",
        "difficulty_level": 3,
        "difficulty_str": "Advanced",
        "question": "Write a Python function `climb_stairs(n)` that calculates the number of distinct ways to reach the top of an n-step staircase if you can take either 1 or 2 steps at each stride.",
        "options": ["Submit Python code in the sandbox editor"],
        "correct_option_index": 0,
        "starter_code": "def climb_stairs(n: int) -> int:\n    if n <= 2: return n\n    a, b = 1, 2\n    for _ in range(3, n + 1):\n        a, b = b, a + b\n    return b\n",
        "test_cases": [
            {"input": "2", "expected_output": "2", "is_hidden": False},
            {"input": "3", "expected_output": "3", "is_hidden": False},
            {"input": "5", "expected_output": "8", "is_hidden": True}
        ],
        "marks": 2,
        "time_limit_sec": 180,
        "explanation": "Ways(n) = Ways(n-1) + Ways(n-2), equivalent to the Fibonacci recurrence."
    },

    # 4. Database Management Systems (DBMS)
    {
        "category": "DBMS",
        "topic": "SQL Basics & Filtering",
        "question_type": "mcq",
        "difficulty_level": 1,
        "difficulty_str": "Beginner",
        "question": "Which SQL clause filters records BEFORE grouping and aggregation take place?",
        "options": ["WHERE", "HAVING", "GROUP BY", "ORDER BY"],
        "correct_option_index": 0,
        "explanation": "WHERE filters base table rows prior to aggregation; HAVING filters aggregate groups after GROUP BY.",
        "marks": 1,
        "time_limit_sec": 60
    },
    {
        "category": "DBMS",
        "topic": "Joins & Normalization",
        "question_type": "sql",
        "difficulty_level": 2,
        "difficulty_str": "Intermediate",
        "question": "Write an SQL query to retrieve the employee name and their department name for all employees in the 'Engineering' department. Tables: employees (name, department_id, salary), departments (id, name).",
        "options": ["Submit SQL query in sandbox"],
        "correct_option_index": 0,
        "expected_answer": "[(Aarav Sharma, Engineering), (Priya Patel, Engineering)]",
        "starter_code": "SELECT e.name, d.name\nFROM employees e\nJOIN departments d ON e.department_id = d.id\nWHERE d.name = 'Engineering';",
        "marks": 2,
        "time_limit_sec": 150,
        "explanation": "An INNER JOIN matches foreign key department_id with department id, filtered by d.name = 'Engineering'."
    },
    {
        "category": "DBMS",
        "topic": "Indexing & ACID Transactions",
        "question_type": "mcq",
        "difficulty_level": 3,
        "difficulty_str": "Advanced",
        "question": "Under PostgreSQL MVCC, which isolation level prevents Non-Repeatable Reads and Phantom Reads without locking entire tables?",
        "options": ["Read Uncommitted", "Read Committed", "Serializable", "Snapshot Isolation / Repeatable Read"],
        "correct_option_index": 2,
        "explanation": "Serializable isolation guarantees equivalent serial execution by tracking read-write dependencies and aborting serialization anomalies.",
        "marks": 1,
        "time_limit_sec": 90
    },

    # 5. Operating Systems
    {
        "category": "Operating Systems",
        "topic": "Process Scheduling",
        "question_type": "mcq",
        "difficulty_level": 1,
        "difficulty_str": "Beginner",
        "question": "Which CPU scheduling algorithm allocates a fixed time quantum cyclically to each process in the ready queue?",
        "options": ["First-Come, First-Served", "Shortest Job First", "Round Robin", "Priority Scheduling"],
        "correct_option_index": 2,
        "explanation": "Round Robin scheduling uses a time slice (quantum) to provide fair preemptive CPU sharing.",
        "marks": 1,
        "time_limit_sec": 60
    },
    {
        "category": "Operating Systems",
        "topic": "Deadlocks & Concurrency",
        "question_type": "mcq",
        "difficulty_level": 2,
        "difficulty_str": "Intermediate",
        "question": "Which of the following is NOT one of Coffman's four necessary conditions for a Deadlock to occur?",
        "options": ["Mutual Exclusion", "Hold and Wait", "No Preemption", "Paging Segmentation"],
        "correct_option_index": 3,
        "explanation": "The four Coffman conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.",
        "marks": 1,
        "time_limit_sec": 90
    },
    {
        "category": "Operating Systems",
        "topic": "Virtual Memory & Paging",
        "question_type": "mcq",
        "difficulty_level": 3,
        "difficulty_str": "Advanced",
        "question": "What happens when a CPU generates a logical memory address whose corresponding page is not currently mapped into physical RAM?",
        "options": ["Thrashing", "Page Fault Interrupt", "TLB Collision", "Segmentation Abort"],
        "correct_option_index": 1,
        "explanation": "The MMU raises a Page Fault trap, prompting the OS kernel to page the required frame from swap storage into RAM.",
        "marks": 1,
        "time_limit_sec": 90
    },

    # 6. Computer Networks
    {
        "category": "Computer Networks",
        "topic": "OSI & TCP/IP Model",
        "question_type": "mcq",
        "difficulty_level": 1,
        "difficulty_str": "Beginner",
        "question": "At which layer of the OSI 7-layer reference model do TCP and UDP protocols operate?",
        "options": ["Network Layer (Layer 3)", "Transport Layer (Layer 4)", "Data Link Layer (Layer 2)", "Session Layer (Layer 5)"],
        "correct_option_index": 1,
        "explanation": "TCP and UDP are Layer 4 (Transport Layer) protocols responsible for end-to-end communication and port multiplexing.",
        "marks": 1,
        "time_limit_sec": 60
    },
    {
        "category": "Computer Networks",
        "topic": "HTTP, HTTPS & TLS",
        "question_type": "mcq",
        "difficulty_level": 2,
        "difficulty_str": "Intermediate",
        "question": "What is the primary role of an asymmetric cryptographic handshake during TLS 1.3 session establishment?",
        "options": [
            "Encrypt all ongoing video stream payloads",
            "Authenticate the server and negotiate a shared symmetric key (AES-GCM)",
            "Compress payload headers with gzip",
            "Resolve domain name records to IP addresses"
        ],
        "correct_option_index": 1,
        "explanation": "Asymmetric encryption (ECDHE) securely establishes a high-performance symmetric session key without transmitting the key itself.",
        "marks": 1,
        "time_limit_sec": 90
    },
    {
        "category": "Computer Networks",
        "topic": "Subnetting & Routing",
        "question_type": "mcq",
        "difficulty_level": 3,
        "difficulty_str": "Advanced",
        "question": "For a CIDR block 192.168.10.0/26, how many usable host IP addresses are available for assignable devices?",
        "options": ["64", "62", "30", "126"],
        "correct_option_index": 1,
        "explanation": "A /26 subnet has 32 - 26 = 6 host bits (2^6 = 64 total addresses). Subtracting the network address and broadcast address yields 62 usable hosts.",
        "marks": 1,
        "time_limit_sec": 90
    },

    # 7. Web Development
    {
        "category": "Web Development",
        "topic": "RESTful API Standards",
        "question_type": "mcq",
        "difficulty_level": 1,
        "difficulty_str": "Beginner",
        "question": "Which HTTP status code is the canonical response when a resource is successfully created via a POST request?",
        "options": ["200 OK", "201 Created", "204 No Content", "301 Moved Permanently"],
        "correct_option_index": 1,
        "explanation": "HTTP 201 Created signifies that the request has succeeded and led to the creation of a new resource.",
        "marks": 1,
        "time_limit_sec": 60
    },
    {
        "category": "Web Development",
        "topic": "CORS & Browser Security",
        "question_type": "mcq",
        "difficulty_level": 2,
        "difficulty_str": "Intermediate",
        "question": "Why does a modern browser send an HTTP OPTIONS 'preflight' request prior to executing a cross-origin PUT or DELETE?",
        "options": [
            "To cache DNS resolution for 24 hours",
            "To verify whether the remote server permits the custom method and headers under CORS policy",
            "To authenticate the user's password hash",
            "To render CSS styles before fetching data"
        ],
        "correct_option_index": 1,
        "explanation": "Preflight OPTIONS checks Access-Control-Allow-Methods and Access-Control-Allow-Origin before risking modifying operations.",
        "marks": 1,
        "time_limit_sec": 90
    },
    {
        "category": "Web Development",
        "topic": "State Management & React",
        "question_type": "mcq",
        "difficulty_level": 3,
        "difficulty_str": "Advanced",
        "question": "In React 18, why is updating state inside a useEffect dependency array without conditional guards problematic?",
        "options": [
            "It triggers immediate browser memory leaks",
            "It induces an infinite re-render loop as state updates trigger effect re-execution",
            "It corrupts server-side session cookies",
            "It forces Next.js to compile pages synchronously"
        ],
        "correct_option_index": 1,
        "explanation": "Updating state triggers a re-render; if that state is a dependency of the useEffect, the effect fires again, causing an infinite loop.",
        "marks": 1,
        "time_limit_sec": 90
    },

    # 8. Frameworks & Tools
    {
        "category": "Frameworks & Tools",
        "topic": "Git Version Control",
        "question_type": "mcq",
        "difficulty_level": 1,
        "difficulty_str": "Beginner",
        "question": "Which Git command incorporates commits from a feature branch into the active branch while creating a merge commit?",
        "options": ["git checkout", "git merge", "git fetch", "git stash"],
        "correct_option_index": 1,
        "explanation": "git merge combines divergent commit histories into the current branch.",
        "marks": 1,
        "time_limit_sec": 60
    },
    {
        "category": "Frameworks & Tools",
        "topic": "Docker & Containers",
        "question_type": "mcq",
        "difficulty_level": 2,
        "difficulty_str": "Intermediate",
        "question": "In a production Dockerfile, why are multi-stage builds recommended?",
        "options": [
            "They allow running Windows and Linux containers simultaneously",
            "They separate compile-time build dependencies from final minimal runtime images",
            "They eliminate the need for Docker daemon",
            "They automatically increase network bandwidth"
        ],
        "correct_option_index": 1,
        "explanation": "Multi-stage builds leave compilers and large SDKs behind in build stages, drastically reducing production image size and attack surface.",
        "marks": 1,
        "time_limit_sec": 90
    },
    {
        "category": "Frameworks & Tools",
        "topic": "Kubernetes & CI/CD",
        "question_type": "mcq",
        "difficulty_level": 3,
        "difficulty_str": "Advanced",
        "question": "Which Kubernetes resource manages rolling zero-downtime updates and replica sets for stateless microservice pods?",
        "options": ["StatefulSet", "Deployment", "DaemonSet", "ConfigMap"],
        "correct_option_index": 1,
        "explanation": "Deployments provide declarative updates for Pods and ReplicaSets, handling rolling updates and rollbacks gracefully.",
        "marks": 1,
        "time_limit_sec": 90
    },

    # 9. Debugging & Problem Solving
    {
        "category": "Debugging",
        "topic": "Python Bug Detection",
        "question_type": "debugging",
        "difficulty_level": 2,
        "difficulty_str": "Intermediate",
        "question": "The function below intends to return the average of a list of numbers, but crashes on an empty list with ZeroDivisionError. Fix the bug and handle empty lists by returning 0.0.",
        "options": ["Submit Python fix in editor"],
        "correct_option_index": 0,
        "starter_code": "def compute_average(nums: list) -> float:\n    # BUG: Crashes on empty list\n    if not nums:\n        return 0.0\n    return sum(nums) / len(nums)\n",
        "test_cases": [
            {"input": "[10, 20, 30]", "expected_output": "20.0", "is_hidden": False},
            {"input": "[]", "expected_output": "0.0", "is_hidden": False},
            {"input": "[5]", "expected_output": "5.0", "is_hidden": True}
        ],
        "marks": 2,
        "time_limit_sec": 180,
        "explanation": "Guard clause `if not nums: return 0.0` prevents division by zero."
    },
    {
        "category": "Debugging",
        "topic": "Off-by-One Loop Error",
        "question_type": "debugging",
        "difficulty_level": 3,
        "difficulty_str": "Advanced",
        "question": "The binary search function below has an off-by-one bug in the right pointer update that causes an infinite loop when the target is absent. Fix the code to return the correct index or -1.",
        "options": ["Submit Python fix in editor"],
        "correct_option_index": 0,
        "starter_code": "def binary_search(arr: list, target: int) -> int:\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n",
        "test_cases": [
            {"input": "([1, 3, 5, 7, 9], 7)", "expected_output": "3", "is_hidden": False},
            {"input": "([1, 3, 5, 7, 9], 4)", "expected_output": "-1", "is_hidden": False},
            {"input": "([2], 2)", "expected_output": "0", "is_hidden": True}
        ],
        "marks": 2,
        "time_limit_sec": 180,
        "explanation": "Updating `right = mid - 1` and `left = mid + 1` guarantees the search space shrinks on every iteration, preventing infinite loops."
    },

    # 10. Technical Interview
    {
        "category": "Technical Interview",
        "topic": "System Design & Scalability",
        "question_type": "interview",
        "difficulty_level": 2,
        "difficulty_str": "Intermediate",
        "question": "Explain how you would design an idempotency key mechanism for payment processing APIs to prevent duplicate charges when network timeouts occur.",
        "options": ["Provide structured answer in text editor"],
        "correct_option_index": 0,
        "marks": 2,
        "time_limit_sec": 240,
        "explanation": "Client generates a unique UUID (Idempotency-Key header). The API checks Redis/DB: if key exists and completed, returns cached response; if in-flight, returns 409 Conflict; if new, persists key and executes charge within database transaction."
    },
    {
        "category": "Technical Interview",
        "topic": "CAP Theorem & Trade-offs",
        "question_type": "interview",
        "difficulty_level": 3,
        "difficulty_str": "Advanced",
        "question": "Under Brewer's CAP Theorem, explain why a distributed database cannot simultaneously guarantee Consistency and Availability during a network partition. How do systems like Cassandra vs PostgreSQL handle this trade-off?",
        "options": ["Provide structured answer in text editor"],
        "correct_option_index": 0,
        "marks": 2,
        "time_limit_sec": 240,
        "explanation": "When network partitions occur, nodes cannot synchronize. To guarantee Consistency, writes must be rejected (sacrificing Availability). To remain Available, writes are accepted on isolated partitions (sacrificing immediate Consistency). Cassandra chooses AP with eventual consistency, while relational databases like PostgreSQL prioritize CP."
    }
]

def seed_comprehensive_questions():
    db = SessionLocal()
    try:
        count = 0
        for q_data in COMPREHENSIVE_QUESTIONS:
            existing = (
                db.query(QuestionBank)
                .filter(QuestionBank.question == q_data["question"])
                .first()
            )
            if not existing:
                q = QuestionBank(
                    category=q_data["category"],
                    topic=q_data["topic"],
                    question_type=q_data["question_type"],
                    difficulty_level=q_data["difficulty_level"],
                    difficulty_str=q_data["difficulty_str"],
                    question=q_data["question"],
                    options=q_data["options"],
                    correct_option_index=q_data["correct_option_index"],
                    explanation=q_data["explanation"],
                    starter_code=q_data.get("starter_code"),
                    test_cases=q_data.get("test_cases", []),
                    expected_answer=q_data.get("expected_answer"),
                    marks=q_data.get("marks", 1),
                    time_limit_sec=q_data.get("time_limit_sec", 120)
                )
                db.add(q)
                count += 1
        db.commit()
        print(f"Seeded {count} new comprehensive questions across all 10 categories!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_comprehensive_questions()
