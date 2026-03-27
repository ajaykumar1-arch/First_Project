# AWS IAM – Step-by-Step Guide

> A complete guide to setting up Identity and Access Management (IAM) in AWS.

---

## 📌 What is IAM?

**IAM (Identity and Access Management)** is an AWS service that lets you securely control access to AWS resources. With IAM you can manage:

- **Users** – People or applications that interact with AWS
- **Groups** – Collections of users with shared permissions
- **Roles** – Temporary credentials for services or cross-account access
- **Policies** – JSON documents that define permissions (allow/deny)

---

## ✅ Prerequisites

Before you begin, make sure you have:

1. An **AWS Account** – [Sign up here](https://aws.amazon.com/free/)
2. **Root account access** (email + password used to create the AWS account)
3. A web browser to access the [AWS Management Console](https://console.aws.amazon.com/)

---

## Step 1: Sign in to AWS Console

1. Go to [https://console.aws.amazon.com/](https://console.aws.amazon.com/)
2. Sign in using your **root account** email and password
3. You will land on the **AWS Management Console** dashboard

> ⚠️ **Important:** Avoid using the root account for daily tasks. The steps below will help you create a separate IAM user.

---

## Step 2: Navigate to IAM

1. In the AWS Console, use the **search bar** at the top
2. Type **"IAM"** and click on **IAM** from the results
3. You will see the **IAM Dashboard**

---

## Step 3: Enable MFA for Root Account (Recommended)

Before creating users, secure your root account:

1. On the IAM Dashboard, find **"Security recommendations"**
2. Click **"Add MFA"** next to the root account
3. Choose an MFA device type:
   - **Authenticator app** (Google Authenticator, Authy) – Recommended
   - **Security key** (YubiKey)
   - **Hardware TOTP token**
4. Follow the on-screen instructions to scan the QR code
5. Enter two consecutive MFA codes to verify
6. Click **"Add MFA"**

---

## Step 4: Create an IAM User

1. In the left sidebar, click **"Users"**
2. Click the **"Create user"** button
3. Fill in the details:
   - **User name:** Enter a name (e.g., `admin-user`)
   - ✅ Check **"Provide user access to the AWS Management Console"** (if the user needs console access)
   - Choose **"I want to create an IAM user"**
   - Set a **custom password** or auto-generate one
   - Optional: ✅ Check "User must create a new password at next sign-in"
4. Click **"Next"**

---

## Step 5: Set Permissions for the User

You have 3 options to assign permissions:

### Option A: Add User to a Group (Recommended)
1. Click **"Add user to group"**
2. If no group exists, click **"Create group"**
   - **Group name:** e.g., `Admins`
   - **Attach policies:** Search and select `AdministratorAccess` (or a more restrictive policy)
   - Click **"Create user group"**
3. Select the group you just created
4. Click **"Next"**

### Option B: Copy Permissions from Existing User
1. Click **"Copy permissions"**
2. Select an existing user to copy from
3. Click **"Next"**

### Option C: Attach Policies Directly
1. Click **"Attach policies directly"**
2. Search for and select the policies you need, e.g.:
   - `AmazonS3FullAccess` – Full access to S3
   - `AmazonEC2FullAccess` – Full access to EC2
   - `ReadOnlyAccess` – Read-only across all services
3. Click **"Next"**

---

## Step 6: Review and Create

1. Review the user details, groups, and permissions
2. Click **"Create user"**
3. **Download or copy the credentials:**
   - Console sign-in URL
   - Username
   - Password (if auto-generated)
4. Click **"Return to users list"**

> 🔒 **Save these credentials securely.** You will not be able to see the password again.

---

## Step 7: Create Access Keys (For CLI / SDK Access)

If the user needs programmatic access (AWS CLI, SDKs):

1. Go to **Users** → Click the user name
2. Go to the **"Security credentials"** tab
3. Scroll to **"Access keys"** → Click **"Create access key"**
4. Select the use case:
   - **Command Line Interface (CLI)**
   - **Application running on AWS**
   - **Third-party service**
5. Click **"Next"** → Add a description (optional) → Click **"Create access key"**
6. **Download the `.csv` file** or copy:
   - `Access Key ID`
   - `Secret Access Key`

> ⚠️ **The Secret Access Key is shown only once.** Save it securely!

---

## Step 8: Configure AWS CLI with the New User

1. Install the AWS CLI: [Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
2. Open your terminal and run:

```bash
aws configure
```

3. Enter the following when prompted:

```
AWS Access Key ID [None]: <your-access-key-id>
AWS Secret Access Key [None]: <your-secret-access-key>
Default region name [None]: ap-south-1
Default output format [None]: json
```

4. Test the configuration:

```bash
aws sts get-caller-identity
```

You should see your account ID and IAM user ARN.

---

## Step 9: Create an IAM Role (Optional)

Roles are used to grant permissions to AWS services (e.g., let an EC2 instance access S3):

1. In the IAM sidebar, click **"Roles"**
2. Click **"Create role"**
3. Choose the **trusted entity type:**
   - **AWS service** – For EC2, Lambda, etc.
   - **AWS account** – For cross-account access
4. Select the service (e.g., **EC2**)
5. Click **"Next"**
6. Attach a policy (e.g., `AmazonS3ReadOnlyAccess`)
7. Click **"Next"**
8. Enter a **Role name** (e.g., `EC2-S3-ReadOnly-Role`)
9. Click **"Create role"**

---

## Step 10: Create a Custom IAM Policy (Optional)

If built-in policies don't fit your needs:

1. In the IAM sidebar, click **"Policies"**
2. Click **"Create policy"**
3. Use the **Visual editor** or **JSON editor**

### Example JSON Policy (Allow S3 read-only for a specific bucket):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-bucket-name",
        "arn:aws:s3:::my-bucket-name/*"
      ]
    }
  ]
}
```

4. Click **"Next"**
5. Enter a **Policy name** (e.g., `S3-MyBucket-ReadOnly`)
6. Click **"Create policy"**

---

## 🔐 IAM Best Practices

| # | Best Practice |
|---|--------------|
| 1 | **Never use the root account** for daily tasks |
| 2 | **Enable MFA** on all accounts, especially root |
| 3 | **Use groups** to assign permissions, not individual users |
| 4 | **Follow least privilege** – grant only the permissions needed |
| 5 | **Rotate access keys** regularly |
| 6 | **Use roles** instead of access keys for AWS services |
| 7 | **Review IAM policies** periodically |
| 8 | **Enable CloudTrail** to log all IAM activity |

---

## 📝 Quick Reference – Common AWS Managed Policies

| Policy Name | Description |
|-------------|-------------|
| `AdministratorAccess` | Full access to all AWS services |
| `PowerUserAccess` | Full access except IAM management |
| `ReadOnlyAccess` | Read-only access to all services |
| `AmazonS3FullAccess` | Full access to S3 |
| `AmazonEC2FullAccess` | Full access to EC2 |
| `AmazonDynamoDBFullAccess` | Full access to DynamoDB |
| `AWSLambda_FullAccess` | Full access to Lambda |
| `CloudWatchFullAccess` | Full access to CloudWatch |

---

## 🔗 Useful Links

- [AWS IAM Documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [IAM Policy Simulator](https://policysim.aws.amazon.com/)
- [AWS CLI Installation](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [AWS Free Tier](https://aws.amazon.com/free/)

---

> **Document Created:** March 27, 2026  
> **Author:** Step-by-step IAM Setup Guide
