import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Key,
  Loader2,
  LogOut,
  Phone,
  Save,
  Shield,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { UtrRecord } from "./backend.d";
import { UtrStatus } from "./backend.d";
import {
  useApproveUtr,
  useGetApiConfig,
  useGetSupportNumber,
  useGetUpiId,
  useGetUtrSubmissions,
  useRejectUtr,
  useSetApiConfig,
  useSetSupportNumber,
  useSetUpiId,
} from "./hooks/useQueries";

const ADMIN_PIN = "admin123";

function formatCurrency(amount: bigint): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function StatusBadge({ status }: { status: UtrStatus }) {
  if (status === UtrStatus.approved) {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border border-green-200">
        <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
      </Badge>
    );
  }
  if (status === UtrStatus.rejected) {
    return (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border border-red-200">
        <XCircle className="w-3 h-3 mr-1" /> Rejected
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-200">
      <AlertCircle className="w-3 h-3 mr-1" /> Pending
    </Badge>
  );
}

function RequestRow({ record, index }: { record: UtrRecord; index: number }) {
  const { mutate: approve, isPending: approving } = useApproveUtr();
  const { mutate: reject, isPending: rejecting } = useRejectUtr();

  const handleApprove = () => {
    approve(record.id, {
      onSuccess: () => toast.success(`UTR ${record.utr} approved`),
      onError: () => toast.error("Failed to approve"),
    });
  };

  const handleReject = () => {
    reject(record.id, {
      onSuccess: () => toast.success(`UTR ${record.utr} rejected`),
      onError: () => toast.error("Failed to reject"),
    });
  };

  const isPending = record.status === UtrStatus.pending;

  return (
    <TableRow data-ocid={`admin.requests.row.${index}`}>
      <TableCell className="font-mono text-xs font-medium">
        {record.vehicleNumber}
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">
        #{record.challanId.toString()}
      </TableCell>
      <TableCell className="font-semibold text-sm">
        {formatCurrency(record.amount)}
      </TableCell>
      <TableCell className="font-mono text-xs">{record.utr}</TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {new Date(record.submittedAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </TableCell>
      <TableCell>
        <StatusBadge status={record.status} />
      </TableCell>
      <TableCell>
        {isPending && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-3 text-xs text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
              onClick={handleApprove}
              disabled={approving || rejecting}
              data-ocid={`admin.approve_button.${index}`}
            >
              {approving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3 h-3 mr-1" />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-3 text-xs text-red-700 border-red-200 hover:bg-red-50 hover:text-red-800"
              onClick={handleReject}
              disabled={approving || rejecting}
              data-ocid={`admin.reject_button.${index}`}
            >
              {rejecting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <XCircle className="w-3 h-3 mr-1" />
              )}
              Reject
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

function UpiSettings() {
  const { data: currentUpiId, isLoading } = useGetUpiId();
  const { mutate: setUpiId, isPending: saving } = useSetUpiId();
  const [upiInput, setUpiInput] = useState("");

  const handleSave = () => {
    const trimmed = upiInput.trim();
    if (!trimmed) {
      toast.error("Please enter a UPI ID");
      return;
    }
    setUpiId(trimmed, {
      onSuccess: () => {
        toast.success("UPI ID updated successfully");
        setUpiInput("");
      },
      onError: () => toast.error("Failed to update UPI ID"),
    });
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <span className="text-blue-700 font-bold text-sm">₹</span>
          </div>
          UPI Payment Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Current UPI ID</p>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <p className="font-mono font-semibold text-foreground text-sm">
              {currentUpiId || (
                <span className="text-muted-foreground italic">
                  Not configured
                </span>
              )}
            </p>
          )}
        </div>
        <Separator />
        <div className="space-y-2">
          <Label
            htmlFor="upi-input"
            className="text-sm font-semibold text-foreground"
          >
            Update UPI ID
          </Label>
          <div className="flex gap-2">
            <Input
              id="upi-input"
              value={upiInput}
              onChange={(e) => setUpiInput(e.target.value)}
              placeholder="e.g. yourname@paytm"
              className="font-mono flex-1"
              data-ocid="admin.upi_input"
            />
            <Button
              onClick={handleSave}
              disabled={saving || !upiInput.trim()}
              className="gap-1.5 shrink-0"
              data-ocid="admin.upi_save_button"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SupportNumberSettings() {
  const { data: currentSupportNumber, isLoading } = useGetSupportNumber();
  const { mutate: setSupportNumber, isPending: saving } = useSetSupportNumber();
  const [supportInput, setSupportInput] = useState("");

  const handleSave = () => {
    const trimmed = supportInput.trim();
    if (!trimmed) {
      toast.error("Please enter a support number");
      return;
    }
    setSupportNumber(trimmed, {
      onSuccess: () => {
        toast.success("Support number updated successfully");
        setSupportInput("");
      },
      onError: () => toast.error("Failed to update support number"),
    });
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
            <Phone className="w-4 h-4 text-green-700" />
          </div>
          Support Helpline Number
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">
            Current Support Number
          </p>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <p className="font-mono font-semibold text-foreground text-sm">
              {currentSupportNumber || (
                <span className="text-muted-foreground italic">
                  Not configured
                </span>
              )}
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          This number will be shown to users when no challan is found for their
          vehicle.
        </p>
        <Separator />
        <div className="space-y-2">
          <Label
            htmlFor="support-input"
            className="text-sm font-semibold text-foreground"
          >
            Update Support Number
          </Label>
          <div className="flex gap-2">
            <Input
              id="support-input"
              value={supportInput}
              onChange={(e) => setSupportInput(e.target.value)}
              placeholder="e.g. 1800-XXX-XXXX"
              className="flex-1"
              data-ocid="admin.support_number.input"
            />
            <Button
              onClick={handleSave}
              disabled={saving || !supportInput.trim()}
              className="gap-1.5 shrink-0"
              data-ocid="admin.support_number.save_button"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ApiSettings() {
  const { data: currentConfig, isLoading } = useGetApiConfig();
  const { mutate: setApiConfig, isPending: saving } = useSetApiConfig();
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const isConfigured = !!(currentConfig?.apiKey && currentConfig?.apiBaseUrl);

  const handleSave = () => {
    const trimmedUrl = apiBaseUrl.trim();
    const trimmedKey = apiKey.trim();
    if (!trimmedUrl) {
      toast.error("Please enter an API Base URL");
      return;
    }
    if (!trimmedKey) {
      toast.error("Please enter an API Key");
      return;
    }
    setApiConfig(
      { apiKey: trimmedKey, apiBaseUrl: trimmedUrl },
      {
        onSuccess: () => {
          toast.success("API configuration saved successfully");
          setApiBaseUrl("");
          setApiKey("");
        },
        onError: () => toast.error("Failed to save API configuration"),
      },
    );
  };

  const maskedKey = (key: string) =>
    key.length > 4 ? `${"*".repeat(key.length - 4)}${key.slice(-4)}` : "****";

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <Globe className="w-4 h-4 text-purple-700" />
          </div>
          Challan API Configuration
          <div className="ml-auto">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : isConfigured ? (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border border-green-200 text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" /> API Configured
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs">
                <AlertCircle className="w-3 h-3 mr-1" /> Using Demo Data
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isLoading && isConfigured && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                API Base URL
              </p>
              <p className="font-mono text-sm font-semibold text-foreground break-all">
                {currentConfig?.apiBaseUrl}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">API Key</p>
              <p className="font-mono text-sm font-semibold text-foreground">
                {maskedKey(currentConfig?.apiKey ?? "")}
              </p>
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Once configured, live challan data will be used instead of demo data.
        </p>
        <Separator />
        <div className="space-y-3">
          <div className="space-y-2">
            <Label
              htmlFor="api-base-url"
              className="text-sm font-semibold text-foreground flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              API Base URL
            </Label>
            <Input
              id="api-base-url"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder="e.g. https://api.example.com/v1"
              className="font-mono"
              data-ocid="admin.api_base_url.input"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="api-key"
              className="text-sm font-semibold text-foreground flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-muted-foreground" />
              API Key
            </Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="font-mono pr-10"
                data-ocid="admin.api_key.input"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || !apiBaseUrl.trim() || !apiKey.trim()}
            className="gap-1.5 w-full"
            data-ocid="admin.api_save_button"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save API Configuration"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentRequests() {
  const { data: submissions, isLoading, isError } = useGetUtrSubmissions();

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-amber-700" />
          </div>
          Payment Requests
          {submissions && submissions.length > 0 && (
            <Badge variant="outline" className="ml-auto text-xs">
              {submissions.filter((s) => s.status === UtrStatus.pending).length}{" "}
              pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div
            className="flex items-center justify-center py-12 gap-3"
            data-ocid="admin.requests.loading_state"
          >
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-muted-foreground">
              Loading submissions...
            </span>
          </div>
        )}

        {isError && (
          <div
            className="flex flex-col items-center py-12 gap-2"
            data-ocid="admin.requests.error_state"
          >
            <AlertCircle className="w-8 h-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Failed to load submissions
            </p>
          </div>
        )}

        {!isLoading &&
          !isError &&
          submissions !== undefined &&
          submissions.length === 0 && (
            <div
              className="flex flex-col items-center py-16 gap-3 text-center"
              data-ocid="admin.requests_empty_state"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground">
                No payment requests yet
              </p>
              <p className="text-sm text-muted-foreground">
                User UTR submissions will appear here for your review.
              </p>
            </div>
          )}
        {!isLoading &&
          !isError &&
          submissions !== undefined &&
          submissions.length > 0 && (
            <div className="overflow-x-auto" data-ocid="admin.requests_table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle No.</TableHead>
                    <TableHead>Challan ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>UTR Number</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((record, i) => (
                    <RequestRow
                      key={record.id.toString()}
                      record={record}
                      index={i + 1}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
      </CardContent>
    </Card>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="border-b border-border bg-card shadow-xs sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-xl text-foreground tracking-tight">
                ChallanPay
              </span>
              <span className="ml-2 text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase tracking-wide">
                Admin
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="gap-1.5 text-sm"
            data-ocid="admin.logout_button"
          >
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-display font-bold text-2xl text-foreground mb-1">
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage UPI settings, support number, API configuration, and review
            payment submissions.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <UpiSettings />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <SupportNumberSettings />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <ApiSettings />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <PaymentRequests />
        </motion.div>
      </main>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setError(false);
    setTimeout(() => {
      if (pin === ADMIN_PIN) {
        onLogin();
      } else {
        setError(true);
        setPin("");
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <Card className="shadow-modal">
          <CardContent className="pt-8 pb-8 px-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-md">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h1 className="font-display font-bold text-2xl text-foreground">
                ChallanPay
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Admin Access</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="pin-input"
                  className="text-sm font-semibold text-foreground"
                >
                  Enter PIN
                </Label>
                <Input
                  id="pin-input"
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="••••••••"
                  className={`text-center tracking-widest text-lg h-12 ${
                    error
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }`}
                  data-ocid="admin.pin_input"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2"
                  data-ocid="admin.login_error_state"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="text-sm font-medium">
                    Incorrect PIN. Try again.
                  </p>
                </motion.div>
              )}

              <Button
                className="w-full h-12 font-semibold text-base"
                onClick={handleLogin}
                disabled={loading || !pin.trim()}
                data-ocid="admin.login_button"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Access Admin Panel"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-4">
          Restricted access. Authorized personnel only.
        </p>
      </motion.div>
    </div>
  );
}

const adminQueryClient = new QueryClient();

export function AdminApp() {
  const [authenticated, setAuthenticated] = useState(false);

  return (
    <QueryClientProvider client={adminQueryClient}>
      {authenticated ? (
        <AdminDashboard onLogout={() => setAuthenticated(false)} />
      ) : (
        <LoginScreen onLogin={() => setAuthenticated(true)} />
      )}
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
