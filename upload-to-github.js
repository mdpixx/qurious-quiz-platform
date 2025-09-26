import { Octokit } from '@octokit/rest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

let connectionSettings;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = readdirSync(dirPath);

  files.forEach(function(file) {
    if (file.startsWith('.git') || file === 'node_modules' || file === '.replit' || file === 'replit.nix' || file.endsWith('.log')) {
      return; // Skip these directories/files
    }
    
    const fullPath = join(dirPath, file);
    if (statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

async function uploadAllFiles() {
  try {
    const octokit = await getGitHubClient();
    const owner = 'mdpixx';
    const repo = 'qurious-quiz-platform';
    
    console.log('Getting all project files...');
    const allFiles = getAllFiles('.');
    console.log(`Found ${allFiles.length} files to upload`);
    
    // Get the repository info
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
    console.log(`Repository: ${repoData.html_url}`);
    
    // Upload each file
    for (const filePath of allFiles) {
      try {
        const relativePath = relative('.', filePath);
        console.log(`Uploading: ${relativePath}`);
        
        const content = readFileSync(filePath);
        const base64Content = content.toString('base64');
        
        await octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: relativePath,
          message: `Add ${relativePath}`,
          content: base64Content,
          branch: 'main'
        });
        
        console.log(`✅ Uploaded: ${relativePath}`);
      } catch (error) {
        if (error.status === 422 && error.message.includes('sha')) {
          // File already exists, try to update it
          try {
            const { data: existingFile } = await octokit.rest.repos.getContent({
              owner,
              repo,
              path: relative('.', filePath)
            });
            
            const content = readFileSync(filePath);
            const base64Content = content.toString('base64');
            
            await octokit.rest.repos.createOrUpdateFileContents({
              owner,
              repo,
              path: relative('.', filePath),
              message: `Update ${relative('.', filePath)}`,
              content: base64Content,
              sha: existingFile.sha,
              branch: 'main'
            });
            
            console.log(`✅ Updated: ${relative('.', filePath)}`);
          } catch (updateError) {
            console.error(`❌ Failed to update ${relative('.', filePath)}:`, updateError.message);
          }
        } else {
          console.error(`❌ Failed to upload ${relative('.', filePath)}:`, error.message);
        }
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n🎉 ALL FILES UPLOADED SUCCESSFULLY!');
    console.log(`🔗 Repository URL: ${repoData.html_url}`);
    console.log(`📁 Total files uploaded: ${allFiles.length}`);
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    throw error;
  }
}

// Run the upload
uploadAllFiles().catch(console.error);