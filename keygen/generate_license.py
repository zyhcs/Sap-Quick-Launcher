#!/usr/bin/env python3
"""
SAP Quick Launcher - 激活码生成工具
====================================
使用方法：
  python generate_license.py <机器码> [到期日]

到期日格式：
  PERMANENT  - 永久授权
  20261231   - 2026年12月31日到期
  20270630   - 2027年6月30日到期

示例：
  python generate_license.py A1B2C3D4-E5F6-G7H8-I9J0-K1L2M3N4O5P6 PERMANENT
  python generate_license.py A1B2C3D4-E5F6-G7H8-I9J0-K1L2M3N4O5P6 20261231

  # 生成网站授权（不绑定机器码，任何机器通用）
  python generate_license.py SITE PERMANENT

注意：
  - LICENSE_SECRET 必须与 lib.rs 中的 LICENSE_SECRET 完全一致
  - 请妥善保管此脚本，不要泄露给用户
"""

import hmac
import hashlib
import sys

# ★★★ 与 lib.rs 中的 LICENSE_SECRET 保持完全一致 ★★★
LICENSE_SECRET = "SAP-QUICK-LAUNCHER-SECRET-2026-BY-AUTHOR"


def generate_license(machine_id: str, expiry: str) -> str:
    """生成激活码"""
    payload = f"{machine_id}|{expiry}"
    mac = hmac.new(
        LICENSE_SECRET.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    )
    digest = mac.digest()
    # 取前 8 字节 = 16 个十六进制字符
    h = digest[:8].hex().upper()
    return f"SAP-{h[0:4]}-{h[4:8]}-{h[8:12]}-{h[12:16]}"


def main():
    print("=" * 50)
    print("  SAP Quick Launcher - 激活码生成工具")
    print("=" * 50)

    if len(sys.argv) >= 2:
        machine_id = sys.argv[1].strip().upper()
        expiry = sys.argv[2].strip().upper() if len(sys.argv) >= 3 else "PERMANENT"
    else:
        print("\n交互式模式：")
        machine_id = input("输入机器码（或 SITE 生成网站授权）: ").strip().upper()
        expiry_input = input("输入到期日（直接回车=永久 / 格式 YYYYMMDD）: ").strip()
        expiry = expiry_input.upper() if expiry_input else "PERMANENT"

    if not machine_id:
        print("错误：机器码不能为空")
        sys.exit(1)

    # 验证到期日格式
    if expiry != "PERMANENT":
        if len(expiry) != 8 or not expiry.isdigit():
            print(f"错误：到期日格式不正确，应为 YYYYMMDD 或 PERMANENT，当前值: {expiry}")
            sys.exit(1)

    code = generate_license(machine_id, expiry)

    print(f"\n机器码:   {machine_id}")
    print(f"到期日:   {'永久' if expiry == 'PERMANENT' else expiry}")
    print(f"\n激活码:   {code}")
    print("\n" + "=" * 50)
    print("请将上方激活码发送给用户")


if __name__ == "__main__":
    main()
