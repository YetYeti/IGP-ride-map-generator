#!/usr/bin/env python3
import sys
import json

try:
    # 使用 sys.executable 获取绝对路径
    python_path = sys.executable
    result = {"path": python_path}
    print(json.dumps(result))
except Exception as e:
    error = {"error": str(e)}
    print(json.dumps(error), file=sys.stderr)
    sys.exit(1)
