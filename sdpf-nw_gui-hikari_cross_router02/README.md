# sdpf-nw_gui

## QmonusValueStream各種リソース(Tekton Pipeline/Task)作成方法


### 手順

1. qvsctlをローカルPCにインストールする
[qvsctl インストール手順](https://docs.valuestream.qmonus.net/guide/qvsctl/install-qvsctl.html)

2. Qmonus Value Stream API に認証を行う

```
qvsctl auth
```

3. Qmonus SDK Cloud Native Adapterを利用するためにQmonus Orgに認証権限のある`GIT_TOKEN`を設定する

```
export GIT_TOKEN=ghp_xxxxxxxxxxxxxxx
```

4. CI/CD Adapter をコンパイルして manifestファイル (Tekton Pipeline/Task) を生成する

```
qvsctl pipeline compile -c .valuestream/config.yml --prefix gui -o .valuestream/output/gui-manifests.yml
```

5. アクセス権限のあるQmonus Value Stream のプロジェクトの一覧を表示し、該当のPJ(`ztgict-z0u2p7gf`)が表示されることを確認する

```
qvsctl project list
```

```
$ qvsctl project list                                                                                                                          
PROJECT NAME   DISPLAY NAME   DESCRIPTION
~~~~~
ztgict-z0u2p7gf   ZTGICT 　　　ZTGICT
```

6. Qmonus Value StreamにPipeline/Taskを登録する

```
qvsctl pipeline apply -f .valuestream/output/gui-manifests.yml -p ztgict-z0u2p7gf
```

7. Qmonus Value StreamにAssemblyLineを登録する

```
qvsctl pipeline apply -f .valuestream/assemblyline/stg-gui.yml -p ztgict-z0u2p7gf
```

```
qvsctl pipeline apply -f .valuestream/assemblyline/prod-gui.yml -p ztgict-z0u2p7gf
```