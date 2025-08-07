import streamlit as st
import pandas as pd
import requests

# App config
st.set_page_config(page_title="Nifty Option Trap Detector", layout="wide")
st.title("🔍 Nifty Option Trap Detector (Streamlit Version)")
st.markdown("Real-time intraday trap detection and strategy suggestions for NIFTY options.")

# NSE URL & Headers
NSE_URL = "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

@st.cache_data(show_spinner=False)
def fetch_option_chain():
    try:
        session = requests.Session()
        session.headers.update(HEADERS)
        res = session.get(NSE_URL, timeout=10)
        data = res.json()
        return data['records']['data'], data['records']['underlyingValue']
    except Exception as e:
        st.error(f"Error fetching data: {e}")
        return [], 0

def analyze_data(data, spot_price):
    traps = []
    max_put_oi = 0
    max_call_oi = 0
    support = resistance = None

    for item in data:
        strike = item['strikePrice']
        ce = item.get('CE')
        pe = item.get('PE')
        if not ce or not pe:
            continue

        call_oi = ce['openInterest']
        call_chg = ce['changeinOpenInterest']
        put_oi = pe['openInterest']
        put_chg = pe['changeinOpenInterest']

        # Trap Detection Logic
        if call_oi > 0:
            pct = (call_chg / call_oi) * 100
            if pct < -20:
                traps.append(f"⚠️ Call Trap at {strike} CE — OI dropped {pct:.1f}%")
        if put_oi > 0:
            pct = (put_chg / put_oi) * 100
            if pct < -20:
                traps.append(f"⚠️ Put Trap at {strike} PE — OI dropped {pct:.1f}%")

        # Support & Resistance
        if put_oi > max_put_oi:
            max_put_oi = put_oi
            support = strike
        if call_oi > max_call_oi:
            max_call_oi = call_oi
            resistance = strike

    return traps, support, resistance

def suggest_strategy(spot, support, resistance):
    if not support or not resistance:
        return "⚠️ Not enough data for strategy suggestion."

    if abs(support - spot) <= 100 and abs(resistance - spot) <= 100:
        return f"✅ Suggest: Iron Condor between **{support} - {resistance}** (Rangebound Market)"
    elif spot < support:
        return f"📈 Suggest: Bull Call Spread — Spot is below support **({support})**"
    elif spot > resistance:
        return f"📉 Suggest: Bear Put Spread — Spot is above resistance **({resistance})**"
    else:
        return f"⚠️ Suggest: Wait & Watch — Spot is in neutral zone"

# Fetch & Display
with st.spinner("Fetching Nifty Option Chain from NSE..."):
    option_data, spot_price = fetch_option_chain()

if option_data:
    traps, support, resistance = analyze_data(option_data, spot_price)
    st.subheader(f"📍 Nifty Spot Price: {spot_price}")
    st.write(f"🔻 **Support (Max Put OI):** {support}")
    st.write(f"🔺 **Resistance (Max Call OI):** {resistance}")

    st.markdown("---")
    st.subheader("🧨 Trap Alerts")
    if traps:
        for trap in traps:
            st.warning(trap)
    else:
        st.success("✅ No major trap signals detected.")

    st.markdown("---")
    st.subheader("🧠 Strategy Suggestion")
    st.info(suggest_strategy(spot_price, support, resistance))
else:
    st.error("❌ Failed to load option chain data.")
