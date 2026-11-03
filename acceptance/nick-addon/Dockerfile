FROM plone/nick:3.0.0

COPY --chown=node:node acceptance/nick-addon /app/packages/aurora-nick-acceptance
RUN pnpm add '@plone/aurora-nick-acceptance@workspace:*'

ENV PROFILES=@plone/aurora-nick-acceptance:default
