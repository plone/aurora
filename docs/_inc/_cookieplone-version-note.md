````{important}
The Plone Aurora templates (`aurora_cmfplone` and `aurora_addon`) require {term}`Cookieplone` 2.0.0 or later, from the `2.0.0b` beta series or the 2.0.0 final release.
They are not available in the 1.x series.

If `uvx` resolves an older release, pin the version explicitly.
While 2.0.0 is still a prerelease, allow prereleases.

```shell
uvx --prerelease=allow --from 'cookieplone>=2.0.0b3' cookieplone
```

Once 2.0.0 final is published, pin the stable release instead.

```shell
uvx --from 'cookieplone>=2.0.0' cookieplone
```
````
