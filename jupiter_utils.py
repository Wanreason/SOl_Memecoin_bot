import aiohttp

async def fetch_token_info(symbol_or_address: str):
    url = f"https://public-api.birdeye.so/public/token/{symbol_or_address}"
    headers = {"X-API-KEY": "birdeye-public-api-key"}

    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as resp:
            if resp.status != 200:
                return None
            data = await resp.json()

    try:
        return {
            "symbol": data["data"]["symbol"],
            "address": data["data"]["address"],
            "price": float(data["data"]["value"])
        }
    except Exception:
        return None

async def get_hot_memecoins(limit=5):
    url = "https://public-api.birdeye.so/public/token/moving"
    params = {"limit": limit, "direction": "DESC", "interval": "1h"}
    headers = {"X-API-KEY": "birdeye-public-api-key"}

    async with aiohttp.ClientSession() as session:
        async with session.get(url, params=params, headers=headers) as resp:
            if resp.status != 200:
                return []

            data = await resp.json()

    tokens = []
    for token in data.get("data", []):
        tokens.append({
            "symbol": token.get("symbol"),
            "address": token.get("address")
        })

    return tokens
