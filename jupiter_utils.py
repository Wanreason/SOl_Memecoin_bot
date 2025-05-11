import requests

def get_hot_memecoins(min_volume_usd=90000, min_liquidity_usd=10000):
    url = "https://quote-api.jup.ag/v6/tokens"
    try:
        response = requests.get(url)
        data = response.json()
        trending = []

        for token in data['tokens']:
            symbol = token.get('symbol', '')
            if "🐶" in symbol or "INU" in symbol.upper() or "DOG" in symbol.upper():  # crude meme filter
                volume = token.get("volume24hUSD", 0)
                liquidity = token.get("liquidityUSD", 0)

                if volume >= min_volume_usd and liquidity >= min_liquidity_usd:
                    trending.append({
                        "symbol": symbol,
                        "name": token.get("name", ""),
                        "volume24h": round(volume, 2),
                        "liquidity": round(liquidity, 2),
                        "price": token.get("price", 0),
                        "address": token.get("address", "")
                    })

        trending.sort(key=lambda x: x['volume24h'], reverse=True)
        return trending[:10]  # return top 10 hot memecoins
    except Exception as e:
        print("Error fetching from Jupiter:", e)
        return []
