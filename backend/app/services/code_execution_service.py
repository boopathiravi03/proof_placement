import ast
import io
import time
import sqlite3
import traceback
from typing import Dict, Any, List, Optional

# In-memory database initialization for safe SQL query assessment
SAMPLE_SQL_SCHEMA = """
CREATE TABLE departments (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL
);

CREATE TABLE employees (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    department_id INTEGER,
    salary INTEGER NOT NULL,
    hire_date TEXT NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE projects (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    lead_id INTEGER,
    budget INTEGER NOT NULL
);

INSERT INTO departments VALUES (1, 'Engineering', 'Bengaluru');
INSERT INTO departments VALUES (2, 'Product', 'Hyderabad');
INSERT INTO departments VALUES (3, 'Data Science', 'Bengaluru');
INSERT INTO departments VALUES (4, 'Human Resources', 'Mumbai');

INSERT INTO employees VALUES (101, 'Aarav Sharma', 1, 95000, '2022-03-15');
INSERT INTO employees VALUES (102, 'Priya Patel', 1, 110000, '2021-06-10');
INSERT INTO employees VALUES (103, 'Rohan Verma', 2, 85000, '2023-01-20');
INSERT INTO employees VALUES (104, 'Ananya Sen', 3, 125000, '2020-11-05');
INSERT INTO employees VALUES (105, 'Vikram Nair', 3, 98000, '2022-08-18');
INSERT INTO employees VALUES (106, 'Sneha Rao', 4, 65000, '2023-04-12');

INSERT INTO projects VALUES (501, 'Payment Gateway Modernization', 102, 450000);
INSERT INTO projects VALUES (502, 'Placement Intelligence Platform', 104, 800000);
INSERT INTO projects VALUES (503, 'Mobile Core V2', 101, 300000);
"""

class CodeExecutionService:
    @staticmethod
    def execute_code(
        language: str,
        code: str,
        test_cases: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Executes student code against test cases in an isolated restricted environment.
        Supports Python syntax analysis and safe simulated execution mode.
        """
        start_time = time.time()
        language = (language or "python").lower()

        if not code or not code.strip():
            return {
                "status": "FAILED",
                "score": 0.0,
                "passed_count": 0,
                "total_count": len(test_cases),
                "error": "No code provided",
                "test_results": [],
                "execution_time_ms": 0,
                "execution_mode": "Safe Sandbox Evaluation"
            }

        # 1. Syntax analysis
        try:
            ast.parse(code)
        except SyntaxError as se:
            return {
                "status": "SYNTAX_ERROR",
                "score": 0.0,
                "passed_count": 0,
                "total_count": len(test_cases),
                "error": f"Syntax Error on line {se.lineno}: {se.msg}",
                "test_results": [],
                "execution_time_ms": round((time.time() - start_time) * 1000, 2),
                "execution_mode": "Safe Sandbox Evaluation"
            }

        # Check for dangerous calls
        blocked_terms = ["import os", "import sys", "import subprocess", "open(", "eval(", "exec(", "__import__"]
        for term in blocked_terms:
            if term in code:
                return {
                    "status": "SECURITY_VIOLATION",
                    "score": 0.0,
                    "passed_count": 0,
                    "total_count": len(test_cases),
                    "error": f"Restricted operation detected: '{term}' is disallowed in sandbox",
                    "test_results": [],
                    "execution_time_ms": 0,
                    "execution_mode": "Safe Sandbox Evaluation"
                }

        # 2. Execute against test cases
        test_results = []
        passed_count = 0

        # Safe execution scope
        safe_globals = {
            "__builtins__": {
                "range": range,
                "len": len,
                "print": print,
                "min": min,
                "max": max,
                "sum": sum,
                "abs": abs,
                "sorted": sorted,
                "list": list,
                "dict": dict,
                "set": set,
                "str": str,
                "int": int,
                "float": float,
                "bool": bool,
                "enumerate": enumerate,
                "zip": zip,
                "reversed": reversed,
            }
        }

        try:
            local_scope: Dict[str, Any] = {}
            exec(code, safe_globals, local_scope)

            # Find the primary user function defined in student code
            func_name = None
            for name, val in local_scope.items():
                if callable(val) and not name.startswith("_"):
                    func_name = name
                    break

            for idx, tc in enumerate(test_cases):
                inp = tc.get("input", "")
                expected = str(tc.get("expected_output", "")).strip()
                is_hidden = tc.get("is_hidden", False)

                try:
                    actual = ""
                    if func_name and func_name in local_scope:
                        # Attempt to evaluate input as literal or string
                        try:
                            parsed_inp = ast.literal_eval(inp)
                            if isinstance(parsed_inp, tuple):
                                res = local_scope[func_name](*parsed_inp)
                            else:
                                res = local_scope[func_name](parsed_inp)
                        except Exception:
                            res = local_scope[func_name](inp)
                        actual = str(res).strip()
                    else:
                        actual = "Function not defined in code"

                    is_pass = (actual == expected)
                    if is_pass:
                        passed_count += 1

                    test_results.append({
                        "test_case": idx + 1,
                        "passed": is_pass,
                        "input": inp if not is_hidden else "[HIDDEN TEST CASE]",
                        "expected": expected if not is_hidden else "[HIDDEN]",
                        "actual": actual if not is_hidden else ("[MATCHED]" if is_pass else "[MISMATCH]"),
                        "is_hidden": is_hidden
                    })
                except Exception as ex:
                    test_results.append({
                        "test_case": idx + 1,
                        "passed": False,
                        "input": inp if not is_hidden else "[HIDDEN TEST CASE]",
                        "expected": expected if not is_hidden else "[HIDDEN]",
                        "actual": f"Runtime Exception: {str(ex)}",
                        "is_hidden": is_hidden
                    })

        except Exception as ex:
            return {
                "status": "RUNTIME_ERROR",
                "score": 0.0,
                "passed_count": 0,
                "total_count": len(test_cases),
                "error": f"Runtime Error: {str(ex)}",
                "test_results": [],
                "execution_time_ms": round((time.time() - start_time) * 1000, 2),
                "execution_mode": "Safe Sandbox Evaluation"
            }

        total_count = len(test_cases)
        partial_score = (passed_count / total_count) if total_count > 0 else 0.0

        status = "PASSED" if passed_count == total_count else "PARTIAL" if passed_count > 0 else "FAILED"

        return {
            "status": status,
            "score": round(partial_score, 2),
            "passed_count": passed_count,
            "total_count": total_count,
            "test_results": test_results,
            "execution_time_ms": round((time.time() - start_time) * 1000, 2),
            "execution_mode": "Safe Sandbox Evaluation"
        }

    @staticmethod
    def execute_sql(
        query: str,
        expected_output: Optional[str] = None,
        test_cases: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Executes student SQL query in an in-memory SQLite sandbox preloaded with departments/employees.
        Blocks DDL / destructive modifications and validates against expected results.
        """
        start_time = time.time()
        clean_query = query.strip() if query else ""

        if not clean_query:
            return {
                "status": "FAILED",
                "score": 0.0,
                "columns": [],
                "rows": [],
                "error": "Empty SQL query provided",
                "execution_time_ms": 0,
                "execution_mode": "In-Memory SQLite Sandbox"
            }

        # Security check: Read-only sandbox
        disallowed = ["drop", "alter", "delete", "insert", "update", "attach", "vacuum"]
        query_words = [w.lower() for w in clean_query.split()]
        if any(d in query_words for d in disallowed):
            return {
                "status": "SECURITY_VIOLATION",
                "score": 0.0,
                "columns": [],
                "rows": [],
                "error": "Only SELECT and WITH queries are permitted in the assessment sandbox.",
                "execution_time_ms": 0,
                "execution_mode": "In-Memory SQLite Sandbox"
            }

        conn = sqlite3.connect(":memory:")
        cur = conn.cursor()

        try:
            # Seed schema
            cur.executescript(SAMPLE_SQL_SCHEMA)
            # Execute student query
            cur.execute(clean_query)
            columns = [desc[0] for desc in cur.description] if cur.description else []
            rows = cur.fetchall()

            elapsed_ms = round((time.time() - start_time) * 1000, 2)

            # Verification against expected output if supplied
            is_correct = True
            if expected_output:
                # Compare stringified representation
                str_rows = str(rows).replace("'", "").replace('"', "").strip()
                clean_exp = expected_output.replace("'", "").replace('"', "").strip()
                is_correct = (str_rows == clean_exp) or (clean_exp in str_rows)

            return {
                "status": "PASSED" if is_correct else "PARTIAL",
                "score": 1.0 if is_correct else 0.5,
                "columns": columns,
                "rows": rows[:50],  # Return up to 50 rows
                "total_rows": len(rows),
                "execution_time_ms": elapsed_ms,
                "execution_mode": "In-Memory SQLite Sandbox",
                "schema_info": "Tables available: 'employees', 'departments', 'projects'"
            }
        except Exception as ex:
            return {
                "status": "SQL_SYNTAX_ERROR",
                "score": 0.0,
                "columns": [],
                "rows": [],
                "error": f"SQL Error: {str(ex)}",
                "execution_time_ms": round((time.time() - start_time) * 1000, 2),
                "execution_mode": "In-Memory SQLite Sandbox"
            }
        finally:
            conn.close()

    @staticmethod
    def evaluate_debugging(
        buggy_code: str,
        student_code: str,
        explanation: str,
        test_cases: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Evaluates a student's debugging solution: runs test cases and scores both fix & explanation.
        """
        exec_res = CodeExecutionService.execute_code("python", student_code, test_cases)
        
        # Evaluate explanation
        exp_score = 0.0
        exp_feedback = ""
        clean_exp = (explanation or "").strip()
        if len(clean_exp) >= 30:
            exp_score = 1.0
            exp_feedback = "Detailed technical explanation provided."
        elif len(clean_exp) >= 10:
            exp_score = 0.5
            exp_feedback = "Brief explanation provided; include root cause analysis for full marks."
        else:
            exp_score = 0.0
            exp_feedback = "Missing explanation of the bug fix."

        combined_score = round(0.7 * exec_res["score"] + 0.3 * exp_score, 2)
        return {
            "status": "PASSED" if combined_score >= 0.8 else "PARTIAL" if combined_score >= 0.4 else "FAILED",
            "combined_score": combined_score,
            "code_score": exec_res["score"],
            "explanation_score": exp_score,
            "explanation_feedback": exp_feedback,
            "test_results": exec_res["test_results"],
            "error": exec_res.get("error")
        }
