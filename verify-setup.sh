#!/bin/bash

echo "=========================================="
echo "公司抽奖系统 - 项目结构验证"
echo "=========================================="
echo ""

# Check Node.js version
echo "检查 Node.js 版本..."
node_version=$(node --version)
echo "✓ Node.js: $node_version"

# Check npm version
echo "检查 npm 版本..."
npm_version=$(npm --version)
echo "✓ npm: $npm_version"

echo ""
echo "=========================================="
echo "项目结构检查"
echo "=========================================="

# Check root files
echo ""
echo "根目录配置文件:"
files=("package.json" "tsconfig.json" ".eslintrc.json" ".prettierrc.json" ".gitignore" "README.md")
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ $file"
  else
    echo "✗ $file (缺失)"
  fi
done

# Check backend
echo ""
echo "Backend 子项目:"
if [ -d "backend" ]; then
  echo "✓ backend/ 目录存在"
  if [ -f "backend/package.json" ]; then
    echo "  ✓ package.json"
  fi
  if [ -f "backend/tsconfig.json" ]; then
    echo "  ✓ tsconfig.json"
  fi
  if [ -f "backend/jest.config.js" ]; then
    echo "  ✓ jest.config.js"
  fi
  if [ -f "backend/src/index.ts" ]; then
    echo "  ✓ src/index.ts"
  fi
else
  echo "✗ backend/ 目录不存在"
fi

# Check web-client
echo ""
echo "Web-client 子项目:"
if [ -d "web-client" ]; then
  echo "✓ web-client/ 目录存在"
  if [ -f "web-client/package.json" ]; then
    echo "  ✓ package.json"
  fi
  if [ -f "web-client/tsconfig.json" ]; then
    echo "  ✓ tsconfig.json"
  fi
  if [ -f "web-client/vite.config.ts" ]; then
    echo "  ✓ vite.config.ts"
  fi
  if [ -f "web-client/src/main.tsx" ]; then
    echo "  ✓ src/main.tsx"
  fi
else
  echo "✗ web-client/ 目录不存在"
fi

# Check h5-client
echo ""
echo "H5-client 子项目:"
if [ -d "h5-client" ]; then
  echo "✓ h5-client/ 目录存在"
  if [ -f "h5-client/package.json" ]; then
    echo "  ✓ package.json"
  fi
  if [ -f "h5-client/tsconfig.json" ]; then
    echo "  ✓ tsconfig.json"
  fi
  if [ -f "h5-client/vite.config.ts" ]; then
    echo "  ✓ vite.config.ts"
  fi
  if [ -f "h5-client/src/main.tsx" ]; then
    echo "  ✓ src/main.tsx"
  fi
else
  echo "✗ h5-client/ 目录不存在"
fi

echo ""
echo "=========================================="
echo "项目结构验证完成！"
echo "=========================================="
echo ""
echo "下一步操作:"
echo "1. 运行 'npm install' 安装所有依赖"
echo "2. 配置 backend/.env 文件（参考 backend/.env.example）"
echo "3. 运行 'npm run test' 验证测试框架"
echo "4. 分别在各子项目中运行 'npm run dev' 启动开发服务器"
echo ""
