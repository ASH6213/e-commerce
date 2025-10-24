import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../../components/Admin/AdminLayout";
import Button from "../../../components/Admin/Button";
import { useAdminAuth } from "../../../context/AdminAuthContext";

const SettingsPage = () => {
  const router = useRouter();
  const { admin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [generalSettings, setGeneralSettings] = useState({
    storeName: "E-Commerce Store",
    storeEmail: "store@example.com",
    storePhone: "+1234567890",
    currency: "USD",
    timezone: "UTC",
  });

  if (!admin) {
    router.push("/admin/login");
    return null;
  }

  const handleGeneralSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // API call to update settings
      console.log("Updating settings:", generalSettings);
      setTimeout(() => {
        setLoading(false);
        alert("Settings updated successfully!");
      }, 1000);
    } catch (error) {
      console.error("Error updating settings:", error);
      setLoading(false);
    }
  };

  const tabs = [
    { id: "general", name: "General", icon: "⚙️" },
    { id: "payment", name: "Payment", icon: "💳" },
    { id: "shipping", name: "Shipping", icon: "🚚" },
    { id: "notifications", name: "Notifications", icon: "🔔" },
  ];

  return (
    <AdminLayout title="Settings">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray500">Settings</h2>
        <p className="text-gray400 text-sm mt-1">Manage your store settings</p>
      </div>

      <div className="flex gap-6">
        {/* Tabs */}
        <div className="w-64 bg-white rounded-lg shadow-md p-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-4 py-3 rounded-md mb-2 transition-colors ${
                activeTab === tab.id
                  ? "bg-blue text-white"
                  : "text-gray500 hover:bg-gray100"
              }`}
            >
              <span className="text-xl mr-3">{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-lg shadow-md p-6">
          {activeTab === "general" && (
            <form onSubmit={handleGeneralSubmit}>
              <h3 className="text-xl font-semibold text-gray500 mb-6">General Settings</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray500 mb-2">
                  Store Name
                </label>
                <input
                  type="text"
                  value={generalSettings.storeName}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, storeName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray500 mb-2">
                  Store Email
                </label>
                <input
                  type="email"
                  value={generalSettings.storeEmail}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, storeEmail: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray500 mb-2">
                  Store Phone
                </label>
                <input
                  type="tel"
                  value={generalSettings.storePhone}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, storePhone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray500 mb-2">
                    Currency
                  </label>
                  <select
                    value={generalSettings.currency}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, currency: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray500 mb-2">
                    Timezone
                  </label>
                  <select
                    value={generalSettings.timezone}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, timezone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue"
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">EST</option>
                    <option value="PST">PST</option>
                  </select>
                </div>
              </div>

              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          )}

          {activeTab === "payment" && (
            <div>
              <h3 className="text-xl font-semibold text-gray500 mb-6">Payment Settings</h3>
              <p className="text-gray400">Payment gateway configuration coming soon...</p>
            </div>
          )}

          {activeTab === "shipping" && (
            <div>
              <h3 className="text-xl font-semibold text-gray500 mb-6">Shipping Settings</h3>
              <p className="text-gray400">Shipping options configuration coming soon...</p>
            </div>
          )}

          {activeTab === "notifications" && (
            <div>
              <h3 className="text-xl font-semibold text-gray500 mb-6">Notification Settings</h3>
              <p className="text-gray400">Notification preferences coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
