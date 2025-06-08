import os
import json
import requests
from datetime import datetime

# 获取当前脚本所在目录
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
IP_LOG_FILE = os.path.join(SCRIPT_DIR, "ip_log.json")

# 从环境变量获取配置
API_TOKEN = os.getenv("CF_API_TOKEN")     # Cloudflare API 令牌 (需要有 DNS 编辑权限)
ZONE_ID = os.getenv("CF_ZONE_ID")         # 域名区域 ID
RECORD_NAME = os.getenv("CF_RECORD_NAME") # 需要更新的子域名
TTL = os.getenv("CF_TTL", "1")            # 默认 TTL 为 1 (自动)
PROXIED = os.getenv("CF_PROXIED", "false").lower() == "true"  # 是否启用 Cloudflare 代理


def get_current_ip():
    """获取当前公网 IP 地址"""
    try:
        response = requests.get("https://api.ipify.org?format=json", timeout=10)
        response.raise_for_status()
        return response.json()["ip"]
    except requests.exceptions.RequestException as e:
        print(f"获取公网 IP 失败: {e}")
        return None


def load_ip_log():
    """加载 IP 记录日志"""
    try:
        if os.path.exists(IP_LOG_FILE):
            with open(IP_LOG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}
    except Exception as e:
        print(f"加载 IP 日志失败: {e}")
        return {}


def save_ip_log(ip_log):
    """保存 IP 记录日志"""
    try:
        with open(IP_LOG_FILE, "w", encoding="utf-8") as f:
            json.dump(ip_log, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"保存 IP 日志失败: {e}")


def get_dns_records():
    """获取 DNS 记录"""
    if not all([API_TOKEN, ZONE_ID, RECORD_NAME]):
        print("缺少必要环境变量，请检查 CF_API_TOKEN、CF_ZONE_ID 和 CF_RECORD_NAME 是否已设置")
        return []
    
    url = f"https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/dns_records"
    
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    params = {
        "name": RECORD_NAME,
        "type": "A"
    }
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if not data["success"]:
            print(f"获取 DNS 记录失败: {data['errors']}")
            return []
            
        return data["result"]
    except requests.exceptions.RequestException as e:
        print(f"请求 API 失败: {e}")
        return []
    except json.JSONDecodeError as e:
        print(f"解析 API 响应失败: {e}")
        return []


def update_dns_record(record_id, ip):
    """更新 DNS 记录"""
    url = f"https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/dns_records/{record_id}"
    
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        ttl_value = int(TTL) if TTL.isdigit() else 1
    except (ValueError, TypeError):
        ttl_value = 1
    
    data = {
        "type": "A",
        "name": RECORD_NAME,
        "content": ip,
        "ttl": ttl_value,
        "proxied": PROXIED
    }
    
    try:
        response = requests.put(url, headers=headers, json=data, timeout=10)
        response.raise_for_status()
        result = response.json()
        
        if result["success"]:
            print("DNS 记录更新成功")
            return True
        else:
            print(f"DNS 更新失败: {result['errors']}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"更新 DNS 记录失败: {e}")
        return False
    except json.JSONDecodeError as e:
        print(f"解析 API 响应失败: {e}")
        return False


def create_dns_record(ip):
    """创建新的 DNS 记录"""
    url = f"https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/dns_records"
    
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        ttl_value = int(TTL) if TTL.isdigit() else 1
    except (ValueError, TypeError):
        ttl_value = 1
    
    data = {
        "type": "A",
        "name": RECORD_NAME,
        "content": ip,
        "ttl": ttl_value,
        "proxied": PROXIED
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)
        response.raise_for_status()
        result = response.json()
        
        if result["success"]:
            print("DNS 记录创建成功")
            return True
        else:
            print(f"DNS 创建失败: {result['errors']}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"创建 DNS 记录失败: {e}")
        return False
    except json.JSONDecodeError as e:
        print(f"解析 API 响应失败: {e}")
        return False


def main():
    """主函数"""
    print(f"[{datetime.now()}] 开始执行 DDNS 更新检查")
    
    # 检查必要环境变量
    if not all([API_TOKEN, ZONE_ID, RECORD_NAME]):
        print("缺少必要环境变量，请检查 CF_API_TOKEN、CF_ZONE_ID 和 CF_RECORD_NAME 是否已设置")
        return
    
    current_ip = get_current_ip()
    if not current_ip:
        print("无法获取当前公网 IP，程序退出")
        return
    
    ip_log = load_ip_log()
    
    # 检查是否已有记录
    if "last_ip" in ip_log and ip_log["last_ip"] == current_ip:
        print(f"IP 未发生变化 ({current_ip})，无需更新")
        return
    
    print(f"检测到 IP 变化: {ip_log.get('last_ip', '无历史记录')} -> {current_ip}")
    
    # 获取现有 DNS 记录
    records = get_dns_records()
    
    success = False
    if records:
        # 更新第一条记录（我们假设只有一个匹配的 A 记录）
        success = update_dns_record(records[0]["id"], current_ip)
    else:
        # 创建新记录
        success = create_dns_record(current_ip)
    
    if success:
        # 更新 IP 日志
        ip_log["last_ip"] = current_ip
        ip_log["last_updated"] = datetime.now().isoformat()
        save_ip_log(ip_log)
        print("IP 更新成功")
    else:
        print("IP 更新失败")


if __name__ == "__main__":
    main()
