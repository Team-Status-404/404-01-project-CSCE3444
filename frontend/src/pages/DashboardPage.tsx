import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom"; // --- NEW: Imported Link ---
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Define the shape of our incoming backend data
interface WatchlistData {
  ticker: string;
  current_price: number;
  ma_5_day: number;
  divergence_warning_active: boolean;
  graph_data: {
    historical_prices: number[];
    historical_sentiment: number[];
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // State to track which stock is currently displayed in the Dual-Axis Graph
  const [activeTicker, setActiveTicker] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;

      try {
        const res = await fetch(
          `http://localhost:5000/api/user/watchlist?user_id=${user.user_id}`,
        );
        const data = await res.json();

        if (data.status === "success") {
          setWatchlist(data.watchlist);
          // Set the first stock in the watchlist as the default active graph
          if (data.watchlist.length > 0) {
            setActiveTicker(data.watchlist[0].ticker);
          }
        } else {
          setError(data.message || "Failed to load watchlist.");
        }
      } catch (err) {
        setError("Network error: Could not reach the server.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  // --- HANDLE DELETION ---
  const handleRemoveTicker = async (
    tickerToRemove: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation(); // Prevents the card's onClick from firing
    if (!user) return;

    try {
      const res = await fetch(`http://localhost:5000/api/watchlist/remove`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.user_id,
          ticker: tickerToRemove,
        }),
      });
      const data = await res.json();

      if (data.status === "success") {
        // Remove the ticker from the local state
        const updatedWatchlist = watchlist.filter(
          (stock) => stock.ticker !== tickerToRemove,
        );
        setWatchlist(updatedWatchlist);

        // If the user deleted the stock currently showing on the graph, switch it
        if (activeTicker === tickerToRemove) {
          setActiveTicker(
            updatedWatchlist.length > 0 ? updatedWatchlist[0].ticker : null,
          );
        }
      } else {
        setError(data.message || `Failed to remove ${tickerToRemove}.`);
      }
    } catch (err) {
      setError("Network error: Could not reach the server to delete item.");
    }
  };

  // --- CHART DATA FORMATTING ---
  const activeStock = watchlist.find((s) => s.ticker === activeTicker);
  const chartData = activeStock
    ? activeStock.graph_data.historical_prices.map((price, index) => ({
        day: `Day ${index + 1}`,
        price: price,
        sentiment: activeStock.graph_data.historical_sentiment[index],
      }))
    : [];

  if (isLoading) {
    return (
      <Layout>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            color: "#94a3b8",
          }}
        >
          <h2>Loading your market intelligence...</h2>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <TopBar
        title="Market Intelligence"
        subtitle={
          watchlist.length === 0
            ? "Your watchlist is empty."
            : "Real-time overview of your tracked assets."
        }
      />

      {error && (
        <div
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderLeft: "4px solid #ef4444",
            padding: "16px",
            margin: "20px 0",
            color: "#f8fafc",
          }}
        >
          {error}
        </div>
      )}

      {/* --- WATCHLIST GRID --- */}
      <section className="section-block" style={{ marginTop: "20px" }}>
        <h3 style={{ margin: "0 0 15px 0" }}>My Watchlist</h3>

        {watchlist.length === 0 && !isLoading && !error ? (
          <p style={{ color: "#94a3b8" }}>
            You aren't tracking any stocks yet. Go to Markets to add some!
          </p>
        ) : (
          <div
            className="watchlist-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {watchlist.map((stock) => (
              <div
                key={stock.ticker}
                onClick={() => setActiveTicker(stock.ticker)}
                style={{
                  padding: "20px 20px 42px 20px",
                  backgroundColor:
                    activeTicker === stock.ticker ? "#1e293b" : "#0f172a",
                  borderRadius: "12px",
                  border:
                    activeTicker === stock.ticker
                      ? "2px solid #38bdf8"
                      : "1px solid #334155",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Visual Warning Alert Banner (FR-03) */}
                {stock.divergence_warning_active && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: "#ef4444",
                      color: "white",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      textAlign: "center",
                      padding: "4px",
                      letterSpacing: "1px",
                    }}
                  >
                    ⚠️ DIVERGENCE WARNING
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: stock.divergence_warning_active ? "15px" : "0",
                  }}
                >
                  {/* --- NEW: Link to Stock Detail Page --- */}
                  <Link
                    to={`/stock/${stock.ticker.toLowerCase()}`}
                    onClick={(e) => e.stopPropagation()} // Prevents the graph from switching when clicking the link
                    style={{ textDecoration: "none" }}
                    title={`View ${stock.ticker} Details`}
                  >
                    <h2
                      style={{
                        margin: 0,
                        color: "#38bdf8",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "color 0.2s",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.color = "#bae6fd")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.color = "#38bdf8")
                      }
                    >
                      {stock.ticker} <span style={{ fontSize: "1rem" }}>↗</span>
                    </h2>
                  </Link>
                  <h3 style={{ margin: 0, color: "#4ade80" }}>
                    ${stock.current_price.toFixed(2)}
                  </h3>
                </div>

                <div
                  style={{
                    marginTop: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.9rem",
                    color: "#94a3b8",
                  }}
                >
                  <span>5D MA:</span>
                  <span>${stock.ma_5_day.toFixed(2)}</span>
                </div>

                {/* --- UPDATED: Neutral Bottom Banner that turns Red on Hover --- */}
                <div
                  onClick={(e) => handleRemoveTicker(stock.ticker, e)}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: "rgba(148, 163, 184, 0.1)", // Neutral slate background
                    color: "#94a3b8", // Neutral slate text
                    textAlign: "center",
                    padding: "8px",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    letterSpacing: "1px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#ef4444"; // Solid red on hover
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(148, 163, 184, 0.1)";
                    e.currentTarget.style.color = "#94a3b8";
                  }}
                >
                  REMOVE FROM WATCHLIST
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- DUAL-AXIS GRAPH (FR-12) --- */}
      {activeStock && (
        <section className="section-block" style={{ marginTop: "40px" }}>
          <article
            className="card"
            style={{
              padding: "24px",
              background: "#1e293b",
              borderRadius: "12px",
              border: activeStock.divergence_warning_active
                ? "2px solid #ef4444"
                : "1px solid #334155",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 5px 0" }}>
                  {activeStock.ticker} : Price vs. Sentiment
                </h3>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.9rem" }}>
                  5-Day Historical Overlay
                </p>
              </div>

              {activeStock.divergence_warning_active && (
                <div
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    color: "#ef4444",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>⚠️</span> The price trend and sentiment trend have
                  critically diverged.
                </div>
              )}
            </div>

            <div style={{ height: "350px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                    vertical={false}
                  />
                  <XAxis dataKey="day" stroke="#94a3b8" />

                  {/* Left Y-Axis: Mapped to Price */}
                  <YAxis
                    yAxisId="left"
                    stroke="#38bdf8"
                    domain={["auto", "auto"]}
                    tickFormatter={(value) => `$${value}`}
                  />

                  {/* Right Y-Axis: Mapped to Sentiment (0-100) */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#4ade80"
                    domain={[0, 100]}
                  />

                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      color: "#fff",
                    }}
                  />
                  <Legend />

                  <Bar
                    yAxisId="right"
                    dataKey="sentiment"
                    fill="#4ade80"
                    opacity={0.4}
                    radius={[4, 4, 0, 0]}
                    name="Hype Score (0-100)"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="price"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    name="Closing Price"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>
      )}
    </Layout>
  );
}
