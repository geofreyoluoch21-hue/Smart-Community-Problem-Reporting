# Security Overview

## Smart Community Problem Reporting System

This project uses Supabase Authentication, PostgreSQL Row Level Security (RLS), database policies, and controlled storage access to protect user and administrator data.

## Authentication

- Users authenticate using Supabase Authentication.
- Email confirmation is enabled.
- Password reset functionality is implemented.
- Passwords are managed by Supabase Authentication and are not stored directly in the application database.
- Users are redirected according to their assigned role after login.

## Role-Based Access Control

The system has two roles:

- `resident`
- `admin`

Newly registered users are assigned the `resident` role by the `handle_new_user()` database function.

Administrator access is checked using the user's profile role.

## Row Level Security

Row Level Security (RLS) is enabled on the main application tables.

### Reports

Residents can:

- Submit their own reports.
- View their own reports.

Administrators can:

- View all reports.
- Update report status.
- Delete reports.

### Profiles

Residents can view their own profile.

Administrators can view resident profiles.

Residents cannot directly modify their role from the client application.

## Database Security Functions

The project uses PostgreSQL security functions including:

- `is_admin()`
- `handle_new_user()`

These functions use `SECURITY DEFINER` with a controlled `search_path`.

This allows the application to perform required database operations while maintaining controlled access to protected data.

## Storage Security

Report images are stored in the Supabase `report-images` storage bucket.

Authenticated users are permitted to upload report images.

The broad storage file-listing policy was removed to reduce unnecessary access to the storage object's file list.

## API Key Security

The frontend uses a Supabase publishable key.

No Supabase secret/service-role key is included in the frontend source code.

The application's database security relies on authentication and Row Level Security rather than attempting to hide the publishable key.

## Security Principles

The project follows these principles:

1. Authentication before accessing protected pages.
2. Role-based access for administrative functions.
3. Row Level Security for database protection.
4. Restricted database operations for residents.
5. Controlled storage access.
6. No secret/service-role credentials in frontend code.
7. Server-side/database policies are used instead of relying only on JavaScript checks.

## Future Security Improvements

Future versions may include:

- Rate limiting for report submissions.
- More granular storage policies.
- Audit logs for administrator actions.
- Stronger input validation.
- Automated security testing.
- Monitoring for suspicious activity.