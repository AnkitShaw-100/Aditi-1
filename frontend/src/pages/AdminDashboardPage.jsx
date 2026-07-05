import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, LogOut, MailCheck, RefreshCw, Users as UsersIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { API_BASE_URL, formatRupees } from "@/lib/api";
import { ADMIN_ENTRY_PATH } from "@/lib/adminRoutes";

const LEGACY_ADMIN_TOKEN_KEY = "aditi_admin_token";

const tabs = {
  newsletter: {
    label: "Newsletter",
    description: "Issue II signups",
    icon: MailCheck,
    path: "/api/admin/issue-reservations",
  },
  users: {
    label: "Users",
    description: "Saved profiles",
    icon: UsersIcon,
    path: "/api/admin/users",
  },
  payments: {
    label: "Purchases",
    description: "Bought magazines",
    icon: CreditCard,
    path: "/api/admin/payments",
  },
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("newsletter");
  const [loadedTabs, setLoadedTabs] = useState({});
  const [users, setUsers] = useState([]);
  const [paymentOrders, setPaymentOrders] = useState([]);
  const [issueReservations, setIssueReservations] = useState([]);
  const [status, setStatus] = useState("idle");
  const [recoveringOrderId, setRecoveringOrderId] = useState("");
  const [message, setMessage] = useState("");

  const totals = useMemo(
    () => ({
      newsletter: issueReservations.length,
      users: users.length,
      payments: paymentOrders.length,
    }),
    [issueReservations, paymentOrders, users]
  );

  const loadTab = useCallback(
    async (tabName) => {
      const tab = tabs[tabName];

      if (!tab) return;

      setStatus("loading");
      setMessage("");

      try {
        const response = await fetch(`${API_BASE_URL}${tab.path}`, {
          credentials: "include",
        });
        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
          navigate(ADMIN_ENTRY_PATH);
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || `Unable to load ${tab.label}`);
        }

        if (tabName === "newsletter") {
          setIssueReservations(data.reservations ?? []);
        }

        if (tabName === "users") {
          setUsers(data.users ?? []);

          if (data.error) {
            setMessage(data.error);
          }
        }

        if (tabName === "payments") {
          setPaymentOrders(data.orders ?? []);

          if (data.sync?.status === "skipped" || data.sync?.status === "error" || data.sync?.status === "partial") {
            setMessage(data.sync.message || "Razorpay data could not be fully loaded.");
          }
        }

        setLoadedTabs((current) => ({ ...current, [tabName]: true }));
        setStatus("ready");
      } catch (error) {
        setMessage(error.message);
        setStatus("error");
      }
    },
    [navigate]
  );

  useEffect(() => {
    localStorage.removeItem(LEGACY_ADMIN_TOKEN_KEY);

    const timerId = window.setTimeout(() => {
      loadTab("newsletter");
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadTab]);

  async function selectTab(tabName) {
    setActiveTab(tabName);
    await loadTab(tabName);
  }

  async function recoverPayment(order) {
    setRecoveringOrderId(order.razorpay_order_id);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/payments/recover`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razorpay_order_id: order.razorpay_order_id }),
      });
      const data = await response.json();

      if (response.status === 401) {
        navigate(ADMIN_ENTRY_PATH);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to recover payment");
      }

      setPaymentOrders(data.orders ?? []);
      setLoadedTabs((current) => ({ ...current, payments: true }));
      setMessage(data.message || "Payment checked.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setRecoveringOrderId("");
    }
  }

  async function logout() {
    await fetch(`${API_BASE_URL}/api/admin/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    navigate(ADMIN_ENTRY_PATH);
  }

  return (
    <section className="account-page min-h-screen px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="account-panel p-5 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
                Admin Dashboard
              </p>
              <h1 className="mt-3 font-rajdhani text-[clamp(2.2rem,7vw,4.4rem)] font-bold leading-none text-chalk">
                Admin records.
              </h1>
              <p className="mt-4 max-w-2xl font-plex text-sm leading-7 text-ash">
                Choose a record type to load the latest data from its source.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                disabled={status === "loading"}
                className="h-10 rounded-none border border-steel/70 px-4 font-rajdhani text-base font-bold text-chalk hover:border-ember hover:bg-plate hover:text-chalk disabled:opacity-40"
                onClick={() => loadTab(activeTab)}
              >
                <RefreshCw className="size-4" />
                {status === "loading" ? "Loading" : "Refresh"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-10 rounded-none border border-steel/70 px-4 font-rajdhani text-base font-bold text-chalk hover:border-ember hover:bg-plate hover:text-chalk"
                onClick={logout}
              >
                <LogOut className="size-4" />
                Logout
              </Button>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-3" role="tablist" aria-label="Admin data sources">
            {Object.entries(tabs).map(([tabName, tab]) => (
              <AdminTabButton
                key={tabName}
                active={activeTab === tabName}
                count={totals[tabName]}
                description={tab.description}
                icon={tab.icon}
                label={tab.label}
                loaded={Boolean(loadedTabs[tabName])}
                loading={status === "loading" && activeTab === tabName}
                onClick={() => selectTab(tabName)}
              />
            ))}
          </div>

          {message ? <p className="mt-4 font-plex text-sm text-ember">{message}</p> : null}

          {activeTab === "newsletter" ? (
            <NewsletterTable
              loading={status === "loading"}
              reservations={issueReservations}
            />
          ) : null}

          {activeTab === "users" ? (
            <UsersTable loading={status === "loading"} users={users} />
          ) : null}

          {activeTab === "payments" ? (
            <PaymentsTable
              loading={status === "loading"}
              orders={paymentOrders}
              recoveringOrderId={recoveringOrderId}
              onRecover={recoverPayment}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function AdminTabButton({
  active,
  count,
  description,
  icon: Icon,
  label,
  loaded,
  loading,
  onClick,
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={[
        "border px-4 py-4 text-left transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember",
        active
          ? "border-ember bg-plate text-chalk"
          : "border-steel/70 bg-transparent text-ash hover:border-ember hover:bg-plate/70 hover:text-chalk",
      ].join(" ")}
      onClick={onClick}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-rajdhani text-lg font-bold">
          <Icon className="size-4" />
          {label}
        </span>
        <span className="font-plex text-xs uppercase tracking-[0.14em] text-ember">
          {loading ? "Loading" : loaded ? count : "Load"}
        </span>
      </span>
      <span className="mt-2 block font-plex text-xs text-ash">{description}</span>
    </button>
  );
}

function NewsletterTable({ loading, reservations }) {
  return (
    <AdminSection
      icon={MailCheck}
      title="Newsletter"
      description="Issue II email signups from the local newsletter table."
    >
      {reservations.length ? (
        <table className="admin-table w-full min-w-[42rem]">
          <thead>
            <tr>
              <th>Email</th>
              <th>Source</th>
              <th>Signed Up</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => (
              <tr key={reservation.id}>
                <td>
                  <b>{reservation.email}</b>
                </td>
                <td>
                  <b>{reservation.source || "landing"}</b>
                </td>
                <td>
                  <b>{reservation.created_at || "No date"}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyState loading={loading} loadingText="Loading newsletter..." emptyText="No newsletter signups found." />
      )}
    </AdminSection>
  );
}

function UsersTable({ loading, users }) {
  return (
    <AdminSection
      icon={UsersIcon}
      title="Users"
      description="Saved profile records from the users table."
    >
      {users.length ? (
        <table className="admin-table w-full min-w-[56rem]">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>DOB</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id || user.clerk_user_id || user.email}>
                <td>
                  <b>{user.username || "Unnamed"}</b>
                </td>
                <td>
                  <b>{user.email || "No email"}</b>
                </td>
                <td>
                  <b>{user.phone_number || "No phone"}</b>
                </td>
                <td>
                  <b>{user.dob || "No DOB"}</b>
                </td>
                <td>
                  <b>{user.created_at || "No date"}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyState loading={loading} loadingText="Loading Clerk users..." emptyText="No Clerk users found." />
      )}
    </AdminSection>
  );
}

function PaymentsTable({ loading, orders, recoveringOrderId, onRecover }) {
  return (
    <AdminSection
      icon={CreditCard}
      title="Purchases"
      description="User purchases from the user_magazines table."
    >
      {orders.length ? (
        <table className="admin-table w-full min-w-[64rem]">
          <thead>
            <tr>
              <th>User</th>
              <th>Magazine</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Order</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={`${order.user_id}-${order.razorpay_order_id}`}>
                <td>
                  <b>{order.username || "Unnamed"}</b>
                  <span>{order.email || "No email"}</span>
                </td>
                <td>
                  <b>{order.magazine_titles || "Magazine"}</b>
                  <span>{order.item_count || 1} item</span>
                </td>
                <td>
                  <b>{order.status}</b>
                </td>
                <td>
                  <b>{formatRupees(order.amount_paise || 0)}</b>
                </td>
                <td>
                  <b>{order.razorpay_order_id || "No order id"}</b>
                  <span>{order.razorpay_payment_id || "No payment id"}</span>
                </td>
                <td>
                  <b>{order.purchased_at || order.updated_at || "No date"}</b>
                </td>
                <td>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={recoveringOrderId === order.razorpay_order_id}
                    className="h-10 rounded-none border border-steel/70 px-4 font-rajdhani text-base font-bold text-chalk hover:border-ember hover:bg-plate hover:text-chalk disabled:opacity-40"
                    onClick={() => onRecover(order)}
                  >
                    <RefreshCw className="size-4" />
                    {recoveringOrderId === order.razorpay_order_id ? "Checking" : "Recover"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyState loading={loading} loadingText="Loading purchases..." emptyText="No magazine purchases found." />
      )}
    </AdminSection>
  );
}

function AdminSection({ children, description, icon: Icon, title }) {
  return (
    <div className="mt-7 border-t border-steel/50 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
            {title}
          </p>
          <p className="mt-2 font-plex text-sm leading-6 text-ash">{description}</p>
        </div>
        <Icon className="size-5 text-ember" />
      </div>
      <div className="mt-4 overflow-x-auto">{children}</div>
    </div>
  );
}

function EmptyState({ emptyText, loading, loadingText }) {
  return (
    <p className="font-plex text-sm text-ash">
      {loading ? loadingText : emptyText}
    </p>
  );
}
