# AWS CI/CD Deployment Guide – Step by Step

> Deploy this Node.js app using **AWS CodePipeline + CodeBuild + Elastic Beanstalk** — a complete CI/CD pipeline.

---

## 🗺️ Architecture Overview

```
┌──────────┐     ┌─────────────┐     ┌───────────┐     ┌──────────────────┐
│  GitHub   │────▶│ CodePipeline│────▶│ CodeBuild │────▶│ Elastic Beanstalk│
│  (Source) │     │ (Orchestr.) │     │ (Build)   │     │ (Deploy)         │
└──────────┘     └─────────────┘     └───────────┘     └──────────────────┘
     │                                     │                    │
  Push code            Installs deps &           Runs on EC2
  triggers             runs tests                with auto-scaling
  pipeline                                       & health checks
```

### What Each Service Does

| Service | Role | Free Tier? |
|---------|------|------------|
| **GitHub** | Stores your source code, triggers pipeline on push | ✅ Free |
| **AWS CodePipeline** | Orchestrates the entire CI/CD workflow | ✅ 1 free pipeline/month |
| **AWS CodeBuild** | Installs dependencies, runs tests, creates artifact | ✅ 100 build-minutes/month |
| **Elastic Beanstalk** | Deploys & manages the app on EC2 with load balancing | ✅ Free (you pay for EC2 `t2.micro`) |

> 💡 **Cost Note:** Using a single `t2.micro` instance, this entire setup is **free-tier eligible** for 12 months.

---

## ✅ Prerequisites

Before starting, ensure you have:

1. ✅ **AWS Account** with IAM user (from your IAM guide)
2. ✅ **GitHub Account** with this repo pushed
3. ✅ **AWS CLI** installed and configured (`aws configure`)
4. ✅ **Node.js** installed locally (v18+) — to test locally before deploying

---

## 📁 Project Files Overview

| File | Purpose |
|------|---------|
| `app.js` | Express.js server with health check & API endpoints |
| `package.json` | Node.js dependencies and scripts |
| `public/index.html` | Frontend dashboard showing CI/CD pipeline status |
| `tests/test.js` | Automated tests (CodeBuild runs these) |
| `buildspec.yml` | **CodeBuild configuration** — defines build steps |
| `Procfile` | Tells Elastic Beanstalk how to start the app |

---

## Step 0: Test Locally First

Before deploying to AWS, make sure the app runs locally:

```bash
# Install dependencies
npm install

# Start the app
npm start

# Visit http://localhost:8080 in your browser
# Check health: http://localhost:8080/health

# Run the tests
npm test
```

You should see:
- ✅ A beautiful dark dashboard at `localhost:8080`
- ✅ All 4 tests passing

---

## Step 1: Push Code to GitHub

If you haven't already, push this project to GitHub:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: AWS DevOps CI/CD demo app"

# Add your GitHub repo as remote
git remote add origin https://github.com/YOUR_USERNAME/first-project.git

# Push to GitHub
git push -u origin main
```

---

## Step 2: Create Elastic Beanstalk Application

This is where your app will actually run.

### Using AWS Console:

1. Go to **AWS Console** → Search **"Elastic Beanstalk"**
2. Click **"Create application"**
3. Fill in:
   - **Application name:** `devops-demo-app`
   - **Platform:** `Node.js`
   - **Platform branch:** `Node.js 18 running on 64bit Amazon Linux 2023`
   - **Platform version:** Use the recommended/latest version
4. Under **Application code:**
   - Select **"Sample application"** (we'll deploy our code through the pipeline)
5. Under **Presets:**
   - Select **"Single instance (free tier eligible)"**
6. Click **"Next"**

### Configure Service Access:

7. **Service role:** Select **"Create and use new service role"** (or use existing `aws-elasticbeanstalk-service-role`)
8. **EC2 key pair:** Select your key pair (or skip if you don't need SSH access)
9. **EC2 instance profile:** 
   - If it doesn't exist, you need to create an IAM role:
     - Go to **IAM** → **Roles** → **Create role**
     - **Trusted entity:** AWS service → **EC2**
     - Attach these policies:
       - `AWSElasticBeanstalkWebTier`
       - `AWSElasticBeanstalkWorkerTier`
       - `AWSElasticBeanstalkMulticontainerDocker`
     - **Role name:** `aws-elasticbeanstalk-ec2-role`
   - Come back and select this role
10. Click **"Next"** through remaining steps (defaults are fine)
11. Click **"Submit"**

> ⏳ Wait 5-10 minutes for the environment to be created. You'll see a green "Health: Ok" when it's ready.

---

## Step 3: Create AWS CodeBuild Project

CodeBuild will install dependencies and run your tests.

### Using AWS Console:

1. Go to **AWS Console** → Search **"CodeBuild"**
2. Click **"Create build project"**
3. Fill in:

**Project Configuration:**
   - **Project name:** `devops-demo-build`
   - **Description:** "Build and test the DevOps demo app"

**Source:**
   - **Source provider:** `GitHub`
   - Click **"Connect to GitHub"** and authorize AWS
   - **Repository:** Select your `first-project` repository
   - **Source version:** `main`

**Environment:**
   - **Provisioning model:** On-demand
   - **Environment image:** Managed image
   - **Compute:** EC2
   - **Operating system:** Amazon Linux
   - **Runtime:** Standard
   - **Image:** `aws/codebuild/amazonlinux2-x86_64-standard:5.0` (latest)
   - **Service role:** Create a new service role (auto-generated)

**Buildspec:**
   - Select **"Use a buildspec file"**
   - **Buildspec name:** Leave as `buildspec.yml` (default)

**Artifacts:**
   - **Type:** `Amazon S3`
   - **Bucket name:** Create an S3 bucket first (e.g., `devops-demo-artifacts-YOUR-ACCOUNT-ID`)
   - **Name:** `devops-demo-build-output`
   - **Packaging:** `Zip`

4. Click **"Create build project"**

### Test the Build:
5. Click **"Start build"** to verify it works
6. Watch the build logs — you should see all 4 tests pass ✅

---

## Step 4: Create AWS CodePipeline

This connects everything together: GitHub → CodeBuild → Elastic Beanstalk.

### Using AWS Console:

1. Go to **AWS Console** → Search **"CodePipeline"**
2. Click **"Create pipeline"**
3. Fill in:

**Pipeline Settings:**
   - **Pipeline name:** `devops-demo-pipeline`
   - **Pipeline type:** V2
   - **Execution mode:** Queued
   - **Service role:** Create new role (or use existing)
   - Click **"Next"**

**Source Stage:**
   - **Source provider:** `GitHub (Version 2)`
   - Click **"Connect to GitHub"** → Create a new connection
     - **Connection name:** `github-connection`
     - Authorize and install the AWS app on your GitHub account
     - Select your GitHub account
     - Click **"Connect"**
   - **Repository name:** Select `first-project`
   - **Default branch:** `main`
   - **Output artifact format:** `CodePipeline default`
   - Click **"Next"**

**Build Stage:**
   - **Build provider:** `AWS CodeBuild`
   - **Region:** Your region (e.g., `ap-south-1`)
   - **Project name:** Select `devops-demo-build`
   - **Build type:** Single build
   - Click **"Next"**

**Deploy Stage:**
   - **Deploy provider:** `AWS Elastic Beanstalk`
   - **Region:** Your region
   - **Application name:** `devops-demo-app`
   - **Environment name:** Select your environment (e.g., `devops-demo-app-env`)
   - Click **"Next"**

4. Review all stages and click **"Create pipeline"**

> 🎉 **The pipeline will automatically trigger and deploy your app!**

---

## Step 5: Verify the Deployment

1. The pipeline will start running automatically
2. Watch each stage go green:
   - ✅ **Source** — Code fetched from GitHub
   - ✅ **Build** — Dependencies installed, tests passed
   - ✅ **Deploy** — App deployed to Elastic Beanstalk
3. Go to **Elastic Beanstalk** → Click your environment
4. Click the **URL** at the top (e.g., `http://devops-demo-app-env.us-east-1.elasticbeanstalk.com`)
5. You should see the **AWS DevOps CI/CD Demo** dashboard! 🚀

---

## Step 6: Test the CI/CD Pipeline

Now test the **automatic deployment** by making a code change:

1. Open `public/index.html` in your editor
2. Change the `<h1>` text to something new, e.g.:

```html
<h1>AWS DevOps CI/CD Demo v2.0 🎉</h1>
```

3. Commit and push:

```bash
git add .
git commit -m "Update: v2.0 with new heading"
git push origin main
```

4. Go to **CodePipeline** in the AWS Console
5. Watch the pipeline trigger automatically! 🔄
6. After ~3-5 minutes, your changes will be live.

> **This is CI/CD in action!** Every push to `main` automatically builds, tests, and deploys.

---

## 🔧 Troubleshooting

### Build fails in CodeBuild
- Go to **CodeBuild** → Click the build → Read the **Build logs**
- Common issues:
  - Missing `buildspec.yml` — make sure it's in the repo root
  - Test failures — fix the failing test and push again

### Deploy fails in Elastic Beanstalk
- Go to **Elastic Beanstalk** → **Logs** → **Request Logs** → **Last 100 Lines**
- Common issues:
  - Port mismatch — Elastic Beanstalk expects port `8080` (already configured in our app)
  - Missing `Procfile` — make sure it's in the repo root
  - Missing instance profile — see Step 2 for IAM role setup

### Pipeline doesn't trigger on push
- Go to **CodePipeline** → **Settings** → Check the GitHub connection status
- Make sure the connection is **"Available"**
- Check that the branch name matches (`main`)

---

## 🧹 Cleanup (To Avoid Charges)

When you're done learning, delete these resources to avoid charges:

```bash
# 1. Delete the CodePipeline
# AWS Console → CodePipeline → Select pipeline → Delete

# 2. Delete the CodeBuild project
# AWS Console → CodeBuild → Select project → Delete

# 3. Terminate the Elastic Beanstalk environment
# AWS Console → Elastic Beanstalk → Select environment → Actions → Terminate

# 4. Delete the S3 artifacts bucket
# AWS Console → S3 → Select bucket → Empty → Delete

# 5. Delete IAM roles created for these services (optional)
```

> ⚠️ **Important:** The EC2 instance in Elastic Beanstalk will incur charges if left running outside the free tier.

---

## 📚 What You've Learned

After completing this project, you now know how to:

| Skill | AWS Service |
|-------|------------|
| ✅ Push code that auto-deploys | CodePipeline |
| ✅ Automate build & test | CodeBuild |
| ✅ Use buildspec.yml for build config | CodeBuild |
| ✅ Deploy apps to the cloud | Elastic Beanstalk |
| ✅ Set up a full CI/CD pipeline | All three + GitHub |
| ✅ Monitor app health | Elastic Beanstalk health checks |

---

## 🚀 Next Steps

Once comfortable, explore these to level up:

1. **Add a staging environment** — Deploy to staging first, then manually approve for production
2. **Use CodeDeploy instead** — Deploy to bare EC2 instances with more control
3. **Add CloudWatch Alarms** — Get notified when your app is unhealthy
4. **Try GitHub Actions** — Alternative CI/CD using GitHub's built-in workflows
5. **Containerize with Docker** — Use ECR + ECS instead of Elastic Beanstalk
6. **Infrastructure as Code** — Define everything with CloudFormation or Terraform

---

> **Document Created:** March 27, 2026  
> **Project:** AWS DevOps CI/CD Demo App
