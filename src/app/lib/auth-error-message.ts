type AuthErrorContext = "email-login" | "signup" | "google";

function errorCode(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return "";
  }
  return String(error.code);
}

export function authErrorMessage(
  error: unknown,
  context: AuthErrorContext = "email-login",
) {
  switch (errorCode(error)) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "The email or password is incorrect.";
    case "auth/email-already-in-use":
      return "An account already exists for this email. Try signing in instead.";
    case "auth/weak-password":
      return "Choose a stronger password with at least 8 characters.";
    case "auth/user-disabled":
      return "This account is currently unavailable. Please contact support.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "We couldn’t connect. Check your internet connection and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "The sign-in window was closed before completion.";
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in window. Allow popups and try again.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists for this email. Sign in using your original method.";
    case "auth/credential-already-in-use":
      return "This sign-in account is already connected to another profile.";
    case "auth/unauthorized-domain":
      return "This sign-in option is not available on the current website address.";
    case "auth/operation-not-allowed":
      return "This sign-in option is temporarily unavailable.";
    case "auth/internal-error":
      return "We couldn’t complete your request. Please try again.";
    default:
      if (context === "signup") {
        return "We couldn’t create your account. Please try again.";
      }
      if (context === "google") {
        return "We couldn’t sign you in with Google. Please try again.";
      }
      return "We couldn’t sign you in. Please try again.";
  }
}
