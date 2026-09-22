/* Northstar Bank - public portal behavior */
(function () {
  "use strict";

  function getSupabase() {
    const client = window.NorthstarSupabase?.client;

    if (!client) {
      throw new Error(
        "Supabase is not configured. Check assets/js/config.js."
      );
    }

    return client;
  }

  function showMessage(message, type = "error") {
    if (window.NorthstarApp?.showToast) {
      window.NorthstarApp.showToast(message, type);
    } else {
      alert(message);
    }
  }

  function setLoading(form, loading) {
    const submit = form.querySelector('button[type="submit"]');

    if (!submit) return;

    if (loading) {
      if (!submit.dataset.originalText) {
        submit.dataset.originalText = submit.textContent;
      }

      submit.disabled = true;
      submit.textContent = "Please wait...";
    } else {
      submit.disabled = false;
      submit.textContent = submit.dataset.originalText || "Submit";
    }
  }

  function friendlyAuthError(error) {
    const message = String(error?.message || "").toLowerCase();

    if (message.includes("invalid login credentials")) {
      return "The email or password is incorrect.";
    }

    if (message.includes("email not confirmed")) {
      return "Please confirm your email address before signing in.";
    }

    if (message.includes("user already registered")) {
      return "An account with this email already exists.";
    }

    if (message.includes("password should be at least")) {
      return "Your password does not meet the minimum requirements.";
    }

    if (message.includes("rate limit")) {
      return "Too many attempts. Please wait a moment and try again.";
    }

    return error?.message || "Authentication failed. Please try again.";
  }

  async function loadProfile(userId) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, status")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;

    return data;
  }

  async function routeAuthenticatedUser(user) {
    const profile = await loadProfile(user.id);

    if (!profile) {
      throw new Error(
        "Your authentication succeeded, but your Northstar profile was not found."
      );
    }

    if (profile.status !== "active") {
      await getSupabase().auth.signOut();
      throw new Error("Your Northstar account is not active.");
    }

    const role = profile.role === "management" ? "management" : "customer";

    /*
     * This is only a UI convenience for existing frontend code.
     * Supabase Auth + database RLS remain the actual security boundary.
     */
    sessionStorage.setItem("northstarRole", role);
    sessionStorage.setItem("northstarUserId", user.id);

    if (role === "management") {
      window.location.replace("../management/dashboard.html");
    } else {
      window.location.replace("../customer/dashboard.html");
    }
  }

  async function initLogin() {
    const form = document.querySelector("#login-form");
    if (!form) return;

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const email = document.querySelector("#email");
      const password = document.querySelector("#password");

      if (!email || !password) return;

      const emailValue = email.value.trim();

      if (!emailValue || !password.value) {
        showMessage("Enter your email address and password.", "error");
        return;
      }

      setLoading(form, true);

      try {
        const supabase = getSupabase();

        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailValue,
          password: password.value
        });

        if (error) throw error;

        if (!data.user) {
          throw new Error("Sign-in completed without a user session.");
        }

        await routeAuthenticatedUser(data.user);
      } catch (error) {
        console.error("[NorthstarBank] Login failed:", error);
        showMessage(friendlyAuthError(error), "error");
        setLoading(form, false);
      }
    });
  }

  async function initRegistration() {
    const form = document.querySelector("#registration-form");
    if (!form) return;

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const firstName = document.querySelector("#first-name")?.value.trim();
      const lastName = document.querySelector("#last-name")?.value.trim();
      const email = document.querySelector("#register-email")?.value.trim();
      const phone = document.querySelector("#phone")?.value.trim();
      const password = document.querySelector("#register-password")?.value;
      const accountType = document.querySelector("#account-type")?.value;

      if (!accountType || !["checking", "savings"].includes(accountType)) {
        showMessage("Select a valid account type.", "error");
        return;
      }

      if (!firstName || !lastName || !email || !phone || !password) {
        showMessage("Please complete all required fields.", "error");
        return;
      }

      setLoading(form, true);

      try {
        const supabase = getSupabase();

        const fullName = `${firstName} ${lastName}`.trim();

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone,
              account_type: accountType
            }
          }
        });

        if (error) throw error;

        /*
         * Supabase may require email confirmation depending on the
         * project's Auth settings.
         */
        if (data.session && data.user) {
          showMessage("Your account was created successfully.", "success");
          await routeAuthenticatedUser(data.user);
          return;
        }

        form.reset();

        showMessage(
          "Your account was created. Check your email to confirm your address, then sign in.",
          "success"
        );
      } catch (error) {
        console.error("[NorthstarBank] Registration failed:", error);
        showMessage(friendlyAuthError(error), "error");
      } finally {
        setLoading(form, false);
      }
    });
  }

  async function redirectIfAlreadyAuthenticated() {
    const isLoginPage = Boolean(document.querySelector("#login-form"));
    const isRegistrationPage = Boolean(
      document.querySelector("#registration-form")
    );

    if (!isLoginPage && !isRegistrationPage) return;

    try {
      const supabase = getSupabase();

      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (data.session?.user) {
        await routeAuthenticatedUser(data.session.user);
      }
    } catch (error) {
      console.warn(
        "[NorthstarBank] Existing-session check failed:",
        error
      );
    }
  }

  function init() {
    initLogin();
    initRegistration();
    redirectIfAlreadyAuthenticated();

    console.log("Northstar public portal ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
